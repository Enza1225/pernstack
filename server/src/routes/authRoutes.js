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

const router = express.Router();

router.post("/send-code", sendCode);
router.post("/verify-code", verify);
router.post("/register", register);
router.post("/login", login);
router.post("/login-with-code", loginWithCode);

// Protected routes
router.get("/me", authenticate, getMe);

// Admin only: get all users
router.get(
  "/admin/users",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    const prisma = require("../config/prisma");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    res.json({ success: true, users });
  },
);

// Admin only: update user role
router.patch(
  "/admin/users/:id/role",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    const prisma = require("../config/prisma");
    const { VALID_ROLES } = require("../services/authService");
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      res.json({ success: true, user: updated });
    } catch {
      res.status(404).json({ success: false, message: "User not found" });
    }
  },
);

module.exports = router;
