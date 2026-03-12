const {
  getAuthorizationUrl,
  handleDanCallback,
  generateState,
} = require("../services/danService");

// Store states temporarily (in production, use Redis or DB)
const pendingStates = new Map();

// Clean up expired states periodically (5 min max age)
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of pendingStates) {
    if (now - data.createdAt > 5 * 60 * 1000) {
      pendingStates.delete(state);
    }
  }
}, 60 * 1000);

// GET /api/auth/dan/login — redirect to DAN authorization
async function danLogin(req, res) {
  try {
    const state = generateState();
    pendingStates.set(state, { createdAt: Date.now() });

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

    // Verify state to prevent CSRF
    if (!pendingStates.has(state)) {
      return res
        .status(400)
        .json({ success: false, message: "State хүчингүй эсвэл дууссан" });
    }
    pendingStates.delete(state);

    const result = await handleDanCallback(code);

    res.json({
      success: true,
      isNew: result.isNew,
      user: result.user,
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
