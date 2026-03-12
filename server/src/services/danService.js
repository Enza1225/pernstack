const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { encrypt } = require("../config/encryption");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;

// DAN system configuration
const DAN_CONFIG = {
  authUrl: process.env.DAN_AUTH_URL || "https://sso.gov.mn/oauth2/authorize",
  tokenUrl: process.env.DAN_TOKEN_URL || "https://sso.gov.mn/oauth2/token",
  userinfoUrl:
    process.env.DAN_USERINFO_URL || "https://sso.gov.mn/oauth2/userinfo",
  clientId: process.env.DAN_CLIENT_ID,
  clientSecret: process.env.DAN_CLIENT_SECRET,
  redirectUri:
    process.env.DAN_REDIRECT_URI || "http://localhost:3000/dan-callback",
  scope: "openid profile",
};

function validateConfig() {
  if (!DAN_CONFIG.clientId || !DAN_CONFIG.clientSecret) {
    throw new Error("DAN_CLIENT_ID болон DAN_CLIENT_SECRET тохируулна уу");
  }
}

// Generate a random state parameter for CSRF protection
function generateState() {
  return crypto.randomBytes(32).toString("hex");
}

// Build the DAN authorization URL
function getAuthorizationUrl(state) {
  validateConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: DAN_CONFIG.clientId,
    redirect_uri: DAN_CONFIG.redirectUri,
    scope: DAN_CONFIG.scope,
    state,
  });
  return `${DAN_CONFIG.authUrl}?${params.toString()}`;
}

// Exchange authorization code for tokens
async function exchangeCodeForToken(code) {
  validateConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: DAN_CONFIG.redirectUri,
    client_id: DAN_CONFIG.clientId,
    client_secret: DAN_CONFIG.clientSecret,
  });

  const response = await fetch(DAN_CONFIG.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("DAN token error:", error);
    throw new Error("ДАН системээс токен авахад алдаа гарлаа");
  }

  return response.json();
}

// Get user info from DAN
async function getUserInfo(accessToken) {
  const response = await fetch(DAN_CONFIG.userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("ДАН системээс хэрэглэгчийн мэдээлэл авахад алдаа гарлаа");
  }

  return response.json();
}

// Extract profile data from DAN userinfo response
function extractDanProfile(danUserInfo) {
  return {
    registerNumber:
      danUserInfo.national_id || danUserInfo.register_number || "",
    lastName: danUserInfo.family_name || "",
    firstName: danUserInfo.given_name || "",
    birthDate: danUserInfo.birthdate || danUserInfo.birth_date || "",
    gender: danUserInfo.gender || "",
    province: danUserInfo.address?.province || danUserInfo.province || "",
    district: danUserInfo.address?.district || danUserInfo.district || "",
  };
}

// Process DAN login/register callback
async function handleDanCallback(code) {
  // Exchange code for tokens
  const tokenData = await exchangeCodeForToken(code);
  const danUserInfo = await getUserInfo(tokenData.access_token);

  const danId = danUserInfo.sub;
  const phone = danUserInfo.phone_number;
  const danProfile = extractDanProfile(danUserInfo);
  const name =
    [danProfile.lastName, danProfile.firstName].filter(Boolean).join(" ") ||
    null;

  if (!danId) {
    throw new Error("ДАН системээс хэрэглэгчийн ID олдсонгүй");
  }

  // Try to find existing user by phone
  let user = null;
  if (phone) {
    const normalizedPhone = phone.startsWith("+976") ? phone : `+976${phone}`;
    user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: { profile: true },
    });
  }

  if (user) {
    // Existing user — update profile with DAN data if no profile yet
    if (!user.profile && danProfile.registerNumber) {
      await saveDanProfile(user.id, danProfile);
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );
    return {
      isNew: false,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        token,
      },
    };
  }

  // New user — register with DAN info
  if (!phone) {
    throw new Error(
      "ДАН системээс утасны дугаар олдсонгүй. Бүртгэл үүсгэх боломжгүй.",
    );
  }

  const normalizedPhone = phone.startsWith("+976") ? phone : `+976${phone}`;
  const newUser = await prisma.user.create({
    data: {
      phone: normalizedPhone,
      name,
      role: "student",
    },
  });

  // Auto-save profile from DAN data
  if (danProfile.registerNumber) {
    await saveDanProfile(newUser.id, danProfile);
  }

  const token = jwt.sign(
    { id: newUser.id, phone: newUser.phone, role: newUser.role },
    JWT_SECRET,
    { expiresIn: "24h" },
  );

  return {
    isNew: true,
    user: {
      id: newUser.id,
      phone: newUser.phone,
      name: newUser.name,
      role: newUser.role,
      token,
    },
  };
}

// Save profile directly from DAN data (trusted source, no verification needed)
async function saveDanProfile(userId, danProfile) {
  const birthDate = danProfile.birthDate
    ? new Date(danProfile.birthDate)
    : new Date();

  await prisma.studentProfile.upsert({
    where: { userId },
    update: {
      registerNumber: encrypt(danProfile.registerNumber),
      lastName: danProfile.lastName,
      firstName: danProfile.firstName,
      birthDate,
      gender: danProfile.gender,
      province: danProfile.province,
      district: danProfile.district,
    },
    create: {
      userId,
      registerNumber: encrypt(danProfile.registerNumber),
      lastName: danProfile.lastName,
      firstName: danProfile.firstName,
      birthDate,
      gender: danProfile.gender,
      province: danProfile.province,
      district: danProfile.district,
    },
  });
}

module.exports = {
  getAuthorizationUrl,
  handleDanCallback,
  generateState,
};
