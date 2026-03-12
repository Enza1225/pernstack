const crypto = require("crypto");
const prisma = require("../config/prisma");

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendVerificationCode(phone) {
  if (!phone) {
    throw new Error("Phone number is required");
  }

  // Delete old unused codes for this phone
  await prisma.verificationCode.deleteMany({
    where: { phone, used: false },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const record = await prisma.verificationCode.create({
    data: { phone, code, expiresAt },
  });

  // 60 секундийн дараа датабаасаас автоматаар устгах
  setTimeout(async () => {
    try {
      await prisma.verificationCode
        .delete({ where: { id: record.id } })
        .catch(() => {});
    } catch {}
  }, 60 * 1000);

  // TODO: SMS илгээх service-тэй холбох (Twilio, MessagePro гэх мэт)
  // Одоогоор console-д хэвлэнэ
  console.log(`[SMS] ${phone} руу баталгаажуулах код: ${code}`);

  return { message: "Verification code sent" };
}

async function verifyCode(phone, code) {
  if (!phone || !code) {
    throw new Error("Phone and code are required");
  }

  const record = await prisma.verificationCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("Invalid or expired code");
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return { verified: true };
}

module.exports = { sendVerificationCode, verifyCode };
