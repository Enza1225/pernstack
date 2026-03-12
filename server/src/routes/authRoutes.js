const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  loginWithCode,
  sendCode,
  verify,
  getMe,
} = require("../controllers/authController");
const { authenticate, authorize } = require("../middleware/errorHandler");
const { authenticateAdmin } = require("./adminAuthRoutes");
const { danLogin, danCallback } = require("../controllers/danController");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});
const smsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/send-code", smsLimiter, sendCode);
router.post("/verify-code", authLimiter, verify);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/login-with-code", authLimiter, loginWithCode);

// DAN system auth
router.get("/dan/login", authLimiter, danLogin);
router.post("/dan/callback", authLimiter, danCallback);

// Protected routes
router.get("/me", authenticate, getMe);

// Admin only: get all users
router.get("/admin/users", authenticateAdmin, async (req, res) => {
  const prisma = require("../config/prisma");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      name: true,
      role: true,
      permissions: true,
      createdAt: true,
    },
  });
  res.json({ success: true, users });
});

// Admin only: update user role
router.patch("/admin/users/:id/role", authenticateAdmin, async (req, res) => {
  const prisma = require("../config/prisma");
  const { VALID_ROLES } = require("../services/authService");
  const userId = parseInt(req.params.id, 10);
  const { role } = req.body;

  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.role === "student") {
      return res
        .status(400)
        .json({ success: false, message: "Оюутны эрхийг өөрчлөх боломжгүй" });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Admin only: create staff/teacher user by phone
router.post("/admin/create-staff", authenticateAdmin, async (req, res) => {
  const prisma = require("../config/prisma");
  const { phone, name, role } = req.body;

  const allowedRoles = ["staff", "teacher", "admin"];
  if (!phone || !role || !allowedRoles.includes(role)) {
    return res
      .status(400)
      .json({ success: false, message: "Утас болон зөв эрх шаардлагатай" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Энэ дугаар бүртгэлтэй байна" });
    }

    const user = await prisma.user.create({
      data: {
        phone,
        name: name || null,
        role,
      },
      select: {
        id: true,
        phone: true,
        permissions: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Admin only: delete staff/teacher user (cannot delete students or self)
router.delete("/admin/users/:id", authenticateAdmin, async (req, res) => {
  const prisma = require("../config/prisma");
  const userId = parseInt(req.params.id, 10);

  try {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }
    if (target.role === "student") {
      return res
        .status(400)
        .json({ success: false, message: "Оюутныг устгах боломжгүй" });
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, message: "Амжилттай устгалаа" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Admin only: update user permissions
router.patch(
  "/admin/users/:id/permissions",
  authenticateAdmin,
  async (req, res) => {
    const prisma = require("../config/prisma");
    const userId = parseInt(req.params.id, 10);
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res
        .status(400)
        .json({ success: false, message: "permissions массив байх ёстой" });
    }

    const VALID_PERMISSIONS = ["user.view", "oauth.manage", "audit.view"];
    const filtered = permissions.filter((p) => VALID_PERMISSIONS.includes(p));

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { permissions: filtered },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          permissions: true,
          createdAt: true,
        },
      });
      res.json({ success: true, user: updated });
    } catch {
      res.status(404).json({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }
  },
);

module.exports = router;
