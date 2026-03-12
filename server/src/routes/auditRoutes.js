const express = require("express");
const { authenticateAdmin } = require("./adminAuthRoutes");
const { getLogs } = require("../controllers/auditController");

const router = express.Router();

// Admin only: view audit logs
router.get("/", authenticateAdmin, getLogs);

module.exports = router;
