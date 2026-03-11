const express = require("express");
const {
  register,
  login,
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

// Protected routes
router.get("/me", authenticate, getMe);

// Admin only: example protected route
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

module.exports = router;
