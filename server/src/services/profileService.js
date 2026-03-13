const prisma = require("../config/prisma");
const { encrypt, decrypt, isEncrypted } = require("../config/encryption");
const { logAudit } = require("./auditService");

// Decrypt all PII fields before returning
function decryptField(value) {
  return isEncrypted(value) ? decrypt(value) : value;
}

function decryptProfile(profile) {
  if (!profile) return profile;
  return {
    ...profile,
    registerNumber: decryptField(profile.registerNumber),
    lastName: decryptField(profile.lastName),
    firstName: decryptField(profile.firstName),
    gender: decryptField(profile.gender),
    province: decryptField(profile.province),
    district: decryptField(profile.district),
  };
}

async function getProfile(userId, ipAddress) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (profile) {
    await logAudit({
      action: "profile.view",
      userId,
      targetType: "StudentProfile",
      targetId: profile.id,
      ipAddress,
    });
  }

  return decryptProfile(profile);
}

async function getAllProfiles(adminUserId, ipAddress) {
  const profiles = await prisma.studentProfile.findMany({
    include: {
      user: {
        select: { id: true, phone: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles.map(decryptProfile);
}

module.exports = { getProfile, getAllProfiles };
