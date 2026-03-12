const { verifyToken } = require("../services/authService");
const { verifyOAuthToken } = require("../services/oauthService");
const { logAudit } = require("../services/auditService");

// Get real client IP (supports proxies)
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
}

// Audit logging middleware — attach helper to req
function auditMiddleware(req, res, next) {
  req.clientIp = getClientIp(req);
  req.audit = (params) => logAudit({ ...params, ipAddress: req.clientIp });
  next();
}

// JWT authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = verifyToken(token);
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

// OAuth2 client token authentication middleware
function authenticateOAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "unauthorized",
      error_description: "Bearer token required",
    });
  }

  const token = authHeader.split(" ")[1];
  verifyOAuthToken(token)
    .then((decoded) => {
      req.oauthClient = decoded;
      next();
    })
    .catch((error) => {
      return res
        .status(401)
        .json({ error: "invalid_token", error_description: error.message });
    });
}

// Accepts either user JWT or OAuth client token
function authenticateAny(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  // Try user JWT first
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    // Not a user token, try OAuth
  }

  verifyOAuthToken(token)
    .then((decoded) => {
      req.oauthClient = decoded;
      next();
    })
    .catch(() => {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    });
}

// Role authorization middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
}

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
}

module.exports = {
  errorHandler,
  authenticate,
  authenticateOAuth,
  authenticateAny,
  authorize,
  getClientIp,
  auditMiddleware,
};
