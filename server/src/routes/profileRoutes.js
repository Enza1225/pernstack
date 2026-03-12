const express = require("express");
const { authenticate, authorize } = require("../middleware/errorHandler");
const {
  getMyProfile,
  adminGetProfiles,
} = require("../controllers/profileController");

const router = express.Router();

// Student: get own profile
router.get("/me", authenticate, getMyProfile);

// Admin: get all profiles
router.get("/all", authenticate, authorize("admin"), adminGetProfiles);

module.exports = router;
