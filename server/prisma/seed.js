const { Pool } = require("pg");
const crypto = require("crypto");

const connectionString =
  process.env.DATABASE_URL ||
  "***DATABASE_URL_REMOVED***";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  const pool = new Pool({ connectionString });

  const hashedPassword = hashPassword("***REMOVED***" + "salt_key");

  const result = await pool.query(
    `INSERT INTO "User" (phone, password, name, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (phone) DO NOTHING
     RETURNING id, phone, name`,
    ["admin", hashedPassword, "Admin"],
  );

  if (result.rows.length > 0) {
    console.log("Admin user created:", result.rows[0]);
  } else {
    console.log("Admin user already exists.");
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
