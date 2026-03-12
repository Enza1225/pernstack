const {
  createProfile,
  getProfile,
  verifyProfile,
  getAllProfiles,
} = require("../services/profileService");
const { getClientIp } = require("../middleware/errorHandler");

async function submitProfile(req, res) {
  try {
    const userId = req.user.id;
    const {
      registerNumber,
      lastName,
      firstName,
      birthDate,
      gender,
      province,
      district,
      examId,
    } = req.body;

    if (
      !registerNumber ||
      !lastName ||
      !firstName ||
      !birthDate ||
      !gender ||
      !province ||
      !district
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Бүх талбарыг бөглөнө үү" });
    }

    const profile = await createProfile(
      userId,
      {
        registerNumber,
        lastName,
        firstName,
        birthDate,
        gender,
        province,
        district,
        examId,
      },
      getClientIp(req),
    );

    res.status(201).json({ success: true, profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getMyProfile(req, res) {
  try {
    const profile = await getProfile(req.user.id, getClientIp(req));
    res.json({ success: true, profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function adminVerifyProfile(req, res) {
  try {
    const profileId = parseInt(req.params.id, 10);
    const profile = await verifyProfile(
      profileId,
      req.user.id,
      getClientIp(req),
    );
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
  submitProfile,
  getMyProfile,
  adminVerifyProfile,
  adminGetProfiles,
};
