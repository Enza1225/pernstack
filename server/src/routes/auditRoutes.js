const express = require("express");
const { authenticate, authorize } = require("../middleware/errorHandler");
const { getLogs } = require("../controllers/auditController");

const router = express.Router();

// Admin only: view audit logs
router.get("/", authenticate, authorize("admin"), getLogs);

module.exports = router;
