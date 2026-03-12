const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const JWT_SECRET =
  process.env.JWT_SECRET || "***REMOVED***";
const JWT_EXPIRES_IN = "24h";
const SALT_ROUNDS = 12;
const VALID_ROLES = ["student", "teacher", "staff", "admin"];

function generateToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function registerUser(phone, password, name, role = "student") {
  if (!phone || !password) {
    throw new Error("Phone and password are required");
  }

  if (!VALID_ROLES.includes(role)) {
    throw new Error("Invalid role");
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw new Error("Phone already registered");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      phone,
      password: hashedPassword,
      name: name || null,
      role,
    },
  });

  const token = generateToken(user);
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    token,
  };
}

async function loginUser(phone, password, expectedRole = null) {
  if (!phone || !password) {
    throw new Error("Phone and password are required");
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.password) {
    throw new Error("Нууц үгээр нэвтрэх боломжгүй. Утасны код ашиглана уу.");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  // Role check: if expectedRole is provided, user must match
  if (expectedRole && user.role !== expectedRole) {
    throw new Error("Access denied. Invalid role for this portal.");
  }

  const token = generateToken(user);
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    token,
  };
}

async function loginWithCode(phone, code, expectedRoles = null) {
  if (!phone || !code) {
    throw new Error("Phone and code are required");
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new Error("User not found");
  }

  if (expectedRoles && !expectedRoles.includes(user.role)) {
    throw new Error("Access denied. Invalid role for this portal.");
  }

  // Verify the code
  const { verifyCode } = require("../services/verificationService");
  await verifyCode(phone, code);

  const token = generateToken(user);
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    token,
  };
}

module.exports = {
  registerUser,
  loginUser,
  loginWithCode,
  verifyToken,
  VALID_ROLES,
};
