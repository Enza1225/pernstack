const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const JWT_SECRET =
  process.env.JWT_SECRET || "***REMOVED***";
const ACCESS_TOKEN_EXPIRY = "1h";

// Generate a cryptographically secure client secret
function generateClientSecret() {
  return crypto.randomBytes(32).toString("hex");
}

// Create a new OAuth client (admin only)
async function createClient(name, allowedIps = []) {
  const clientId = uuidv4();
  const clientSecret = generateClientSecret();

  const client = await prisma.oAuthClient.create({
    data: {
      clientId,
      clientSecret, // In production, hash this before storing
      name,
      allowedIps,
    },
  });

  // Return the plain secret only once at creation time
  return {
    id: client.id,
    clientId: client.clientId,
    clientSecret, // Show only at creation
    name: client.name,
    allowedIps: client.allowedIps,
    isActive: client.isActive,
    createdAt: client.createdAt,
  };
}

// Validate client credentials and issue access token
async function issueToken(clientId, clientSecret, grantType, requestIp) {
  if (grantType !== "client_credentials") {
    throw new Error("Unsupported grant_type. Use 'client_credentials'.");
  }

  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    throw new Error("Invalid client_id");
  }

  if (!client.isActive) {
    throw new Error("Client is deactivated");
  }

  if (client.clientSecret !== clientSecret) {
    throw new Error("Invalid client_secret");
  }

  // IP Whitelist check
  if (client.allowedIps && client.allowedIps.length > 0 && requestIp) {
    const normalizedIp = requestIp.replace("::ffff:", "");
    if (!client.allowedIps.includes(normalizedIp)) {
      throw new Error(
        `Access denied. IP ${normalizedIp} is not whitelisted for this client.`,
      );
    }
  }

  // Generate JWT access token
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const accessToken = jwt.sign(
    {
      type: "oauth_client",
      clientId: client.clientId,
      clientDbId: client.id,
      name: client.name,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  // Store the token in DB
  await prisma.oAuthToken.create({
    data: {
      accessToken,
      clientId: client.id,
      expiresAt,
    },
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
  };
}

// Verify an OAuth access token
async function verifyOAuthToken(token) {
  // Verify JWT signature and expiration
  const decoded = jwt.verify(token, JWT_SECRET);

  if (decoded.type !== "oauth_client") {
    throw new Error("Not an OAuth client token");
  }

  // Check if token exists in DB and is not revoked
  const dbToken = await prisma.oAuthToken.findUnique({
    where: { accessToken: token },
    include: { client: true },
  });

  if (!dbToken || dbToken.revoked) {
    throw new Error("Token revoked or invalid");
  }

  if (!dbToken.client.isActive) {
    throw new Error("Client deactivated");
  }

  return decoded;
}

// Revoke a token
async function revokeToken(token) {
  await prisma.oAuthToken.updateMany({
    where: { accessToken: token },
    data: { revoked: true },
  });
}

// Get all clients (admin)
async function getAllClients() {
  return prisma.oAuthClient.findMany({
    select: {
      id: true,
      clientId: true,
      name: true,
      allowedIps: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { tokens: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Update client allowed IPs
async function updateClientIps(id, allowedIps) {
  return prisma.oAuthClient.update({
    where: { id },
    data: { allowedIps },
  });
}

// Toggle client active status
async function toggleClient(id, isActive) {
  const client = await prisma.oAuthClient.update({
    where: { id },
    data: { isActive },
  });

  // If deactivating, revoke all active tokens
  if (!isActive) {
    await prisma.oAuthToken.updateMany({
      where: { clientId: id, revoked: false },
      data: { revoked: true },
    });
  }

  return client;
}

// Delete a client and its tokens
async function deleteClient(id) {
  await prisma.oAuthToken.deleteMany({ where: { clientId: id } });
  await prisma.oAuthClient.delete({ where: { id } });
}

module.exports = {
  createClient,
  issueToken,
  verifyOAuthToken,
  revokeToken,
  getAllClients,
  updateClientIps,
  toggleClient,
  deleteClient,
};
