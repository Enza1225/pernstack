const { registerUser, loginUser } = require("../services/authService");
const {
  sendVerificationCode,
  verifyCode,
} = require("../services/verificationService");

async function sendCode(req, res) {
  try {
    const { phone } = req.body;
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
    const { phone, password, name, role } = req.body;
    const user = await registerUser(phone, password, name, role);
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

module.exports = { register, login, sendCode, verify, getMe };
