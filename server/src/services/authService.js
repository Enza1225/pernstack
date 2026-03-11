const crypto = require("crypto");
const prisma = require("../config/prisma");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function registerUser(phone, password, name) {
  if (!phone || !password) {
    throw new Error("Phone and password are required");
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw new Error("Phone already registered");
  }

  const hashedPassword = hashPassword(password + "salt_key");

  const user = await prisma.user.create({
    data: {
      phone,
      password: hashedPassword,
      name: name || null,
    },
  });

  return { id: user.id, phone: user.phone, name: user.name };
}

async function loginUser(phone, password) {
  if (!phone || !password) {
    throw new Error("Phone and password are required");
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = hashPassword(password + "salt_key");
  if (user.password !== hashedPassword) {
    throw new Error("Invalid password");
  }

  return { id: user.id, phone: user.phone, name: user.name };
}

module.exports = { registerUser, loginUser };
