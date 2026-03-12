const express = require("express");
const { authenticate, authorize } = require("../middleware/errorHandler");
const {
  submitProfile,
  getMyProfile,
  adminVerifyProfile,
  adminGetProfiles,
} = require("../controllers/profileController");

const router = express.Router();

// Student: submit profile
router.post("/", authenticate, submitProfile);

// Student: get own profile
router.get("/me", authenticate, getMyProfile);

// Admin: get all profiles
router.get("/all", authenticate, authorize("admin"), adminGetProfiles);

// Admin: verify a profile
router.patch(
  "/:id/verify",
  authenticate,
  authorize("admin"),
  adminVerifyProfile,
);

module.exports = router;
