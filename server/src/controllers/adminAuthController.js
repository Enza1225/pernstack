const {
  verifyCredentials,
  verifyTotpAndLogin,
  setupTotp,
  enableTotp,
  createAdmin,
  getQrCode,
  generateStepToken,
  verifyStepToken,
} = require("../services/adminAuthService");

// Step 1: Login with email + password
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    const result = await verifyCredentials(email, password);
    const stepToken = generateStepToken(result.adminId);

    if (result.totpEnabled) {
      // TOTP required — send back stepToken for step 2
      return res.json({
        success: true,
        requireTotp: true,
        stepToken,
        message: "TOTP код оруулна уу",
      });
    }

    // TOTP not set up yet — need setup first
    return res.json({
      success: true,
      requireTotpSetup: true,
      stepToken,
      message: "TOTP тохиргоо хийх шаардлагатай",
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
}

// Step 2: Verify TOTP code and get token
async function adminVerifyTotp(req, res) {
  try {
    const { stepToken, totpCode } = req.body;

    if (!stepToken || !totpCode) {
      return res.status(400).json({
        success: false,
        message: "Step token болон TOTP код шаардлагатай",
      });
    }

    const adminId = verifyStepToken(stepToken);

    const result = await verifyTotpAndLogin(adminId, totpCode);

    // Set secure HTTP-only cookie
    res.cookie("adminToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      path: "/",
    });

    res.json({
      success: true,
      admin: result.admin,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
}

// TOTP Setup: Generate QR code
async function adminSetupTotp(req, res) {
  try {
    const { stepToken } = req.body;
    if (!stepToken) {
      return res
        .status(400)
        .json({ success: false, message: "Step token шаардлагатай" });
    }

    const adminId = verifyStepToken(stepToken);

    const result = await setupTotp(adminId);
    res.json({
      success: true,
      qrCode: result.qrCode,
      secret: result.secret,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// TOTP Enable: Verify first code to activate TOTP
async function adminEnableTotp(req, res) {
  try {
    const { stepToken, totpCode } = req.body;
    if (!stepToken || !totpCode) {
      return res.status(400).json({
        success: false,
        message: "Step token болон TOTP код шаардлагатай",
      });
    }

    const adminId = verifyStepToken(stepToken);

    await enableTotp(adminId, totpCode);

    // After enabling, issue token
    const loginResult = await verifyTotpAndLogin(adminId, totpCode);

    res.cookie("adminToken", loginResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      success: true,
      admin: loginResult.admin,
      message: "TOTP амжилттай идэвхжлээ",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// Get current admin info
async function adminMe(req, res) {
  const prisma = require("../config/prisma");
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.adminId },
      select: { id: true, email: true, totpEnabled: true, createdAt: true },
    });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Админ олдсонгүй" });
    }
    res.json({ success: true, admin });
  } catch (error) {
    console.error("adminMe error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Logout: clear cookie
async function adminLogout(req, res) {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  res.json({ success: true, message: "Амжилттай гарлаа" });
}

// Create initial admin (protected — only existing admin can create)
async function adminCreate(req, res) {
  try {
    const { email, password } = req.body;
    const result = await createAdmin(email, password);
    res.status(201).json({ success: true, admin: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// Get QR code for existing TOTP setup
async function adminGetQr(req, res) {
  try {
    const { stepToken } = req.body;
    if (!stepToken) {
      return res
        .status(400)
        .json({ success: false, message: "Step token шаардлагатай" });
    }

    const adminId = verifyStepToken(stepToken);
    const result = await getQrCode(adminId);
    res.json({
      success: true,
      qrCode: result.qrCode,
      secret: result.secret,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  adminLogin,
  adminVerifyTotp,
  adminSetupTotp,
  adminEnableTotp,
  adminMe,
  adminLogout,
  adminCreate,
  adminGetQr,
};
