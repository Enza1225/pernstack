const { getProfile, getAllProfiles } = require("../services/profileService");
const { getClientIp } = require("../middleware/errorHandler");

async function getMyProfile(req, res) {
  try {
    const profile = await getProfile(req.user.id, getClientIp(req));
    res.json({ success: true, profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function adminGetProfiles(req, res) {
  try {
    const profiles = await getAllProfiles(req.user.id, getClientIp(req));
    res.json({ success: true, profiles });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  getMyProfile,
  adminGetProfiles,
};
