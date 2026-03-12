const express = require("express");
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

const router = express.Router();

router.post("/send-code", sendCode);
router.post("/verify-code", verify);
router.post("/register", register);
router.post("/login", login);
router.post("/login-with-code", loginWithCode);

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
  } catch {
    res.status(404).json({ success: false, message: "User not found" });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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

    const VALID_PERMISSIONS = [
      "user.view",
      "profile.verify",
      "oauth.manage",
      "audit.view",
    ];
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
