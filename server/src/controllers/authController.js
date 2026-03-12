const { registerUser, loginUser } = require("../services/authService");
const {
  sendVerificationCode,
  verifyCode,
} = require("../services/verificationService");

async function sendCode(req, res) {
  try {
    const { phone } = req.body;

    // Бүртгэгдсэн дугаар руу код илгээхгүй
    const prisma = require("../config/prisma");
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Энэ дугаар бүртгэлтэй байна. Нэвтрэх хуудас руу очно уу.",
        alreadyRegistered: true,
      });
    }

    const result = await sendVerificationCode(phone);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function verify(req, res) {
  try {
    const { phone, code } = req.body;
    const result = await verifyCode(phone, code);
    res.status(200).json({ success: true, verified: result.verified });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function register(req, res) {
  try {
    const { phone, password, name } = req.body;
    const user = await registerUser(phone, password, name);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { phone, password, role } = req.body;
    const user = await loginUser(phone, password, role || null);
    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMe(req, res) {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      phone: req.user.phone,
      role: req.user.role,
    },
  });
}

async function loginWithCode(req, res) {
  try {
    const { phone, code, roles } = req.body;
    const {
      loginWithCode: loginWithCodeService,
    } = require("../services/authService");
    const user = await loginWithCodeService(phone, code, roles || null);
    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = { register, login, loginWithCode, sendCode, verify, getMe };
