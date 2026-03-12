const prisma = require("../config/prisma");

/**
 * Log an audit event
 * @param {Object} params
 * @param {string} params.action - e.g. "profile.create", "profile.view", "oauth.token"
 * @param {number} [params.userId] - User who performed the action
 * @param {string} [params.clientId] - OAuth client ID
 * @param {string} [params.targetType] - e.g. "StudentProfile", "User"
 * @param {number} [params.targetId] - ID of target resource
 * @param {string} [params.ipAddress] - Request IP
 * @param {object} [params.details] - Extra details
 */
async function logAudit({
  action,
  userId,
  clientId,
  targetType,
  targetId,
  ipAddress,
  details,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || null,
        clientId: clientId || null,
        targetType: targetType || null,
        targetId: targetId || null,
        ipAddress: ipAddress || null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
}

/**
 * Get audit logs with filtering (admin only)
 */
async function getAuditLogs({
  action,
  userId,
  clientId,
  limit = 50,
  offset = 0,
}) {
  const where = {};
  if (action) where.action = { contains: action };
  if (userId) where.userId = userId;
  if (clientId) where.clientId = clientId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

module.exports = { logAudit, getAuditLogs };
