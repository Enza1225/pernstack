const { getAuditLogs } = require("../services/auditService");

async function getLogs(req, res) {
  try {
    const { action, userId, clientId, limit, offset } = req.query;
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const result = await getAuditLogs({
      action: action || undefined,
      userId: userId ? Number(userId) : undefined,
      clientId: clientId || undefined,
      limit: safeLimit,
      offset: offset ? Number(offset) : 0,
    });
    res.json({ success: true, logs: result.logs, total: result.total });
  } catch (error) {
    console.error("Audit log error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { getLogs };
