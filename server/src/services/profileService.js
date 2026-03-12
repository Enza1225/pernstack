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

async function createProfile(userId, data, ipAddress) {
  const existing = await prisma.studentProfile.findUnique({
    where: { userId },
  });
  if (existing) {
    throw new Error("Profile already exists");
  }

  const profile = await prisma.studentProfile.create({
    data: {
      userId,
      registerNumber: encrypt(data.registerNumber),
      lastName: data.lastName,
      firstName: data.firstName,
      birthDate: new Date(data.birthDate),
      gender: data.gender,
      province: data.province,
      district: data.district,
      examId: data.examId || null,
      isVerified: false,
    },
  });

  await logAudit({
    action: "profile.create",
    userId,
    targetType: "StudentProfile",
    targetId: profile.id,
    ipAddress,
  });

  return decryptProfile(profile);
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

async function verifyProfile(profileId, adminUserId, ipAddress) {
  const profile = await prisma.studentProfile.update({
    where: { id: profileId },
    data: { isVerified: true },
  });

  await logAudit({
    action: "profile.verify",
    userId: adminUserId,
    targetType: "StudentProfile",
    targetId: profileId,
    ipAddress,
  });

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

  await logAudit({
    action: "profile.list",
    userId: adminUserId,
    targetType: "StudentProfile",
    ipAddress,
    details: { count: profiles.length },
  });

  return profiles.map(decryptProfile);
}

module.exports = { createProfile, getProfile, verifyProfile, getAllProfiles };
