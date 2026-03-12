const express = require("express");
const rateLimit = require("express-rate-limit");
const { verifyAdminToken } = require("../services/adminAuthService");
const {
  adminLogin,
  adminVerifyTotp,
  adminSetupTotp,
  adminEnableTotp,
  adminMe,
  adminLogout,
  adminCreate,
  adminGetQr,
} = require("../controllers/adminAuthController");

const router = express.Router();

// Rate limiter for login attempts: 10 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Хэт олон оролдлого. 15 минутын дараа дахин оролдоно уу.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for TOTP verification: 5 per 5 minutes
const totpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Хэт олон TOTP оролдлого. 5 минутын дараа дахин оролдоно уу.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin JWT authentication middleware
function authenticateAdmin(req, res, next) {
  // Check cookie first, then Authorization header
  const tokenFromCookie = req.cookies?.adminToken;
  const authHeader = req.headers.authorization;
  const tokenFromHeader =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Админ нэвтрэлт шаардлагатай" });
  }

  try {
    req.admin = verifyAdminToken(token);
    next();
  } catch (error) {
    res.clearCookie("adminToken");
    return res
      .status(401)
      .json({ success: false, message: "Токен хүчингүй эсвэл дууссан" });
  }
}

// Input sanitization middleware
function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
}

// Public routes (with rate limiting)
router.post("/login", loginLimiter, sanitizeInput, adminLogin);
router.post("/verify-totp", totpLimiter, sanitizeInput, adminVerifyTotp);
router.post("/setup-totp", totpLimiter, sanitizeInput, adminSetupTotp);
router.post("/enable-totp", totpLimiter, sanitizeInput, adminEnableTotp);
router.post("/get-qr", totpLimiter, sanitizeInput, adminGetQr);

// Protected routes
router.get("/me", authenticateAdmin, adminMe);
router.post("/logout", authenticateAdmin, adminLogout);

// Admin create (protected — only existing admin can create new admin)
router.post("/create", authenticateAdmin, adminCreate);

module.exports = router;
module.exports.authenticateAdmin = authenticateAdmin;
