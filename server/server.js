const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

const healthRoutes = require("./src/routes/healthRoutes");
const authRoutes = require("./src/routes/authRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const oauthRoutes = require("./src/routes/oauthRoutes");
const auditRoutes = require("./src/routes/auditRoutes");
const adminAuthRoutes = require("./src/routes/adminAuthRoutes");
const { auditMiddleware } = require("./src/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(auditMiddleware);

app.get("/", (req, res) => {
  res.json({ message: "PERN server running" });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/profile", profileRoutes);
app.use("/oauth", oauthRoutes);
app.use("/api/audit", auditRoutes);

// HTTP server
app.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
});

// HTTPS server (if SSL certificates exist)
const SSL_KEY = process.env.SSL_KEY_PATH || "./ssl/key.pem";
const SSL_CERT = process.env.SSL_CERT_PATH || "./ssl/cert.pem";

if (fs.existsSync(SSL_KEY) && fs.existsSync(SSL_CERT)) {
  const httpsOptions = {
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT),
  };
  https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
  });
} else {
  console.log(
    "SSL certificates not found. HTTPS disabled. To enable, place key.pem and cert.pem in ./ssl/",
  );
}
