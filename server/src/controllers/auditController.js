const { getAuditLogs } = require("../services/auditService");

async function getLogs(req, res) {
  try {
    const { action, userId, clientId, limit, offset } = req.query;
    const result = await getAuditLogs({
      action: action || undefined,
      userId: userId ? Number(userId) : undefined,
      clientId: clientId || undefined,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
    res.json({ success: true, logs: result.logs, total: result.total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getLogs };
