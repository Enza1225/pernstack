const { verifyToken } = require("../services/authService");

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

module.exports = { errorHandler, authenticate, authorize };
