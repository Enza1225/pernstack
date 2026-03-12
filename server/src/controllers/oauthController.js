const {
  issueToken,
  revokeToken,
  createClient,
  getAllClients,
  toggleClient,
  deleteClient,
  updateClientIps,
} = require("../services/oauthService");
const { logAudit } = require("../services/auditService");
const { getClientIp } = require("../middleware/errorHandler");

// POST /oauth/token — Issue access token
async function token(req, res) {
  try {
    const { client_id, client_secret, grant_type } = req.body;

    if (!client_id || !client_secret || !grant_type) {
      return res.status(400).json({
        error: "invalid_request",
        error_description:
          "client_id, client_secret, and grant_type are required",
      });
    }

    const requestIp = getClientIp(req);
    const result = await issueToken(
      client_id,
      client_secret,
      grant_type,
      requestIp,
    );

    await logAudit({
      action: "oauth.token.issued",
      clientId: client_id,
      ipAddress: requestIp,
      details: { grant_type },
    });

    res.json(result);
  } catch (error) {
    const requestIp = getClientIp(req);
    await logAudit({
      action: "oauth.token.failed",
      clientId: req.body?.client_id,
      ipAddress: requestIp,
      details: { error: error.message },
    });

    res.status(401).json({
      error: "invalid_client",
      error_description: error.message,
    });
  }
}

// POST /oauth/revoke — Revoke token
async function revoke(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ error: "Token required" });
    }
    const tokenStr = authHeader.split(" ")[1];
    await revokeToken(tokenStr);
    res.json({ success: true, message: "Token revoked" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Admin: Create new OAuth client
async function adminCreateClient(req, res) {
  try {
    const { name, allowedIps } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Client name is required" });
    }
    const client = await createClient(name, allowedIps || []);
    await logAudit({
      action: "oauth.client.created",
      userId: req.user.id,
      ipAddress: getClientIp(req),
      details: { clientName: name },
    });
    res.status(201).json({ success: true, client });
  } catch (error) {
    console.error("Create client error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Admin: Update client allowed IPs
async function adminUpdateClientIps(req, res) {
  try {
    const { id } = req.params;
    const { allowedIps } = req.body;
    if (!Array.isArray(allowedIps)) {
      return res.status(400).json({ message: "allowedIps must be an array" });
    }
    const client = await updateClientIps(parseInt(id), allowedIps);
    await logAudit({
      action: "oauth.client.ips_updated",
      userId: req.user.id,
      ipAddress: getClientIp(req),
      targetType: "OAuthClient",
      targetId: parseInt(id),
      details: { allowedIps },
    });
    res.json({ success: true, client });
  } catch (error) {
    console.error("Update client IPs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Admin: Get all clients
async function adminGetClients(req, res) {
  try {
    const clients = await getAllClients();
    res.json({ success: true, clients });
  } catch (error) {
    console.error("Get clients error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Admin: Toggle client
async function adminToggleClient(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const client = await toggleClient(parseInt(id), isActive);
    res.json({ success: true, client });
  } catch (error) {
    console.error("Toggle client error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Admin: Delete client
async function adminDeleteClient(req, res) {
  try {
    const { id } = req.params;
    await deleteClient(parseInt(id));
    res.json({ success: true, message: "Client deleted" });
  } catch (error) {
    console.error("Delete client error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  token,
  revoke,
  adminCreateClient,
  adminGetClients,
  adminToggleClient,
  adminDeleteClient,
  adminUpdateClientIps,
};
