const prisma = require("../config/prisma");

async function createProfile(userId, data) {
  const existing = await prisma.studentProfile.findUnique({
    where: { userId },
  });
  if (existing) {
    throw new Error("Profile already exists");
  }

  const profile = await prisma.studentProfile.create({
    data: {
      userId,
      registerNumber: data.registerNumber,
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

  return profile;
}

async function getProfile(userId) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });
  return profile;
}

async function verifyProfile(profileId) {
  const profile = await prisma.studentProfile.update({
    where: { id: profileId },
    data: { isVerified: true },
  });
  return profile;
}

async function getAllProfiles() {
  const profiles = await prisma.studentProfile.findMany({
    include: {
      user: {
        select: { id: true, phone: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return profiles;
}

module.exports = { createProfile, getProfile, verifyProfile, getAllProfiles };
