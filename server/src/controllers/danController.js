const {
  getAuthorizationUrl,
  handleDanCallback,
  generateState,
} = require("../services/danService");
const { setTokenCookie } = require("../middleware/errorHandler");
const redis = require("../config/redis");

// GET /api/auth/dan/login — redirect to DAN authorization
async function danLogin(req, res) {
  try {
    const state = generateState();
    // Store state in Redis with 5 minute expiry
    await redis.set(`dan_state:${state}`, "1", "EX", 300);

    const authUrl = getAuthorizationUrl(state);
    res.json({ success: true, authUrl, state });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/auth/dan/callback — handle DAN callback
async function danCallback(req, res) {
  try {
    const { code, state } = req.body;

    if (!code || !state) {
      return res
        .status(400)
        .json({ success: false, message: "Код болон state шаардлагатай" });
    }

    // Verify and consume state atomically to prevent CSRF and replay
    const stateValid = await redis.del(`dan_state:${state}`);
    if (!stateValid) {
      return res
        .status(400)
        .json({ success: false, message: "State хүчингүй эсвэл дууссан" });
    }

    const result = await handleDanCallback(code, req.clientIp);

    // Set httpOnly cookie instead of returning token in body
    setTokenCookie(res, result.user.token);

    res.json({
      success: true,
      isNew: result.isNew,
      user: {
        id: result.user.id,
        phone: result.user.phone,
        name: result.user.name,
        role: result.user.role,
      },
      message: result.isNew
        ? "ДАН системээр амжилттай бүртгэгдлээ"
        : "ДАН системээр амжилттай нэвтэрлээ",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  danLogin,
  danCallback,
};
