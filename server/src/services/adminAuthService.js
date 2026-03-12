const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  NobleCryptoPlugin,
  ScureBase32Plugin,
  generateSecret,
  generateURI,
  verifySync,
} = require("otplib");
const QRCode = require("qrcode");
const prisma = require("../config/prisma");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "8h";
const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const APP_NAME = "MNUAC Admin";

// TOTP plugins
const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

// Short-lived token for step 2 (after password verified, before TOTP)
function generateStepToken(adminId) {
  return jwt.sign({ adminId, step: "totp" }, JWT_SECRET, { expiresIn: "5m" });
}

function verifyStepToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.step !== "totp") {
    throw new Error("Invalid step token");
  }
  return decoded.adminId;
}

function generateAdminToken(admin) {
  return jwt.sign(
    { adminId: admin.id, email: admin.email, isAdmin: true },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function verifyAdminToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded.isAdmin) {
    throw new Error("Not an admin token");
  }
  return decoded;
}

// Check if account is locked
function isAccountLocked(admin) {
  if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
    return true;
  }
  return false;
}

// Record failed login attempt
async function recordFailedAttempt(adminId, currentAttempts) {
  const newAttempts = currentAttempts + 1;
  const data = { failedAttempts: newAttempts };

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    data.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  await prisma.admin.update({
    where: { id: adminId },
    data,
  });

  return newAttempts;
}

// Reset failed attempts on success
async function resetFailedAttempts(adminId) {
  await prisma.admin.update({
    where: { id: adminId },
    data: { failedAttempts: 0, lockedUntil: null },
  });
}

// Step 1: Verify email + password, return whether TOTP is needed
async function verifyCredentials(email, password) {
  if (!email || !password) {
    throw new Error("Email болон нууц үг шаардлагатай");
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Имэйл хаяг буруу байна");
  }

  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!admin) {
    // Timing-safe: still hash to prevent timing attacks
    await bcrypt.hash("dummy", SALT_ROUNDS);
    throw new Error("Имэйл эсвэл нууц үг буруу");
  }

  if (isAccountLocked(admin)) {
    const remaining = Math.ceil(
      (new Date(admin.lockedUntil) - new Date()) / 60000,
    );
    throw new Error(
      `Хэт олон оролдлого. ${remaining} минутын дараа дахин оролдоно уу.`,
    );
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    const attempts = await recordFailedAttempt(admin.id, admin.failedAttempts);
    const remaining = MAX_FAILED_ATTEMPTS - attempts;
    if (remaining > 0) {
      throw new Error(
        `Имэйл эсвэл нууц үг буруу. ${remaining} оролдлого үлдсэн.`,
      );
    } else {
      throw new Error(
        `Хэт олон оролдлого. Бүртгэл ${LOCK_DURATION_MS / 60000} минут түгжигдлээ.`,
      );
    }
  }

  return {
    adminId: admin.id,
    email: admin.email,
    totpEnabled: admin.totpEnabled,
  };
}

// Step 2: Verify TOTP code and issue token
async function verifyTotpAndLogin(adminId, totpCode) {
  if (!adminId || !totpCode) {
    throw new Error("Admin ID болон TOTP код шаардлагатай");
  }

  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    throw new Error("Админ олдсонгүй");
  }

  if (isAccountLocked(admin)) {
    throw new Error("Бүртгэл түгжигдсэн байна");
  }

  if (!admin.totpSecret || !admin.totpEnabled) {
    throw new Error("TOTP тохиргоо хийгдээгүй байна");
  }

  const result = verifySync({
    secret: admin.totpSecret,
    token: totpCode,
    crypto,
    base32,
    window: 1,
  });
  if (!result.valid) {
    const attempts = await recordFailedAttempt(admin.id, admin.failedAttempts);
    const remaining = MAX_FAILED_ATTEMPTS - attempts;
    if (remaining > 0) {
      throw new Error(`TOTP код буруу. ${remaining} оролдлого үлдсэн.`);
    } else {
      throw new Error("Хэт олон оролдлого. Бүртгэл түгжигдлээ.");
    }
  }

  await resetFailedAttempts(admin.id);

  const adminToken = generateAdminToken(admin);
  return {
    token: adminToken,
    admin: {
      id: admin.id,
      email: admin.email,
    },
  };
}

// Setup TOTP: generate secret and QR code
async function setupTotp(adminId) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    throw new Error("Админ олдсонгүй");
  }

  const secret = generateSecret({ crypto, base32 });
  const otpauth = generateURI({
    secret,
    issuer: APP_NAME,
    label: admin.email,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  // Save secret (not yet enabled until verified)
  await prisma.admin.update({
    where: { id: adminId },
    data: { totpSecret: secret },
  });

  return {
    secret,
    qrCode: qrCodeDataUrl,
    otpauth,
  };
}

// Enable TOTP after verifying first code
async function enableTotp(adminId, totpCode) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin || !admin.totpSecret) {
    throw new Error("TOTP тохиргоо эхлээгүй байна");
  }

  const result = verifySync({
    secret: admin.totpSecret,
    token: totpCode,
    crypto,
    base32,
    window: 1,
  });
  if (!result.valid) {
    throw new Error("TOTP код буруу. Дахин оролдоно уу.");
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: { totpEnabled: true },
  });

  return { enabled: true };
}

// Create admin account (for seeding / initial setup)
async function createAdmin(email, password) {
  if (!email || !password) {
    throw new Error("Email болон нууц үг шаардлагатай");
  }

  if (password.length < 8) {
    throw new Error("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой");
  }

  const existing = await prisma.admin.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) {
    throw new Error("Энэ имэйл бүртгэлтэй байна");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await prisma.admin.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
    },
  });

  return { id: admin.id, email: admin.email };
}

// Get QR code from existing saved secret (does NOT regenerate)
async function getQrCode(adminId) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    throw new Error("Админ олдсонгүй");
  }
  if (!admin.totpSecret) {
    throw new Error("TOTP тохиргоо хийгдээгүй байна");
  }

  const otpauth = generateURI({
    secret: admin.totpSecret,
    issuer: APP_NAME,
    label: admin.email,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  return {
    qrCode: qrCodeDataUrl,
    secret: admin.totpSecret,
  };
}

module.exports = {
  verifyCredentials,
  verifyTotpAndLogin,
  setupTotp,
  enableTotp,
  createAdmin,
  verifyAdminToken,
  generateAdminToken,
  getQrCode,
  generateStepToken,
  verifyStepToken,
};
