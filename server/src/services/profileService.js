const prisma = require("../config/prisma");
const { encrypt, decrypt, isEncrypted } = require("../config/encryption");
const { logAudit } = require("./auditService");

// Decrypt sensitive fields before returning
function decryptProfile(profile) {
  if (!profile) return profile;
  return {
    ...profile,
    registerNumber: isEncrypted(profile.registerNumber)
      ? decrypt(profile.registerNumber)
      : profile.registerNumber,
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
