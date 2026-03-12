const express = require("express");
const { authenticate, authorize } = require("../middleware/errorHandler");
const {
  token,
  revoke,
  adminCreateClient,
  adminGetClients,
  adminToggleClient,
  adminDeleteClient,
  adminUpdateClientIps,
} = require("../controllers/oauthController");

const router = express.Router();

// Public: Get access token with client credentials
router.post("/token", token);

// Public: Revoke a token
router.post("/revoke", revoke);

// Admin: Manage OAuth clients
router.post("/clients", authenticate, authorize("admin"), adminCreateClient);
router.get("/clients", authenticate, authorize("admin"), adminGetClients);
router.patch(
  "/clients/:id",
  authenticate,
  authorize("admin"),
  adminToggleClient,
);
router.put(
  "/clients/:id/ips",
  authenticate,
  authorize("admin"),
  adminUpdateClientIps,
);
router.delete(
  "/clients/:id",
  authenticate,
  authorize("admin"),
  adminDeleteClient,
);

module.exports = router;
