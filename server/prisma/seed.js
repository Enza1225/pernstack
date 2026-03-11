const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const connectionString =
  process.env.DATABASE_URL ||
  "***DATABASE_URL_REMOVED***";

async function main() {
  const pool = new Pool({ connectionString });

  const hashedPassword = await bcrypt.hash("***REMOVED***", 12);

  // Update existing admin or create new one
  const existing = await pool.query(`SELECT id FROM "User" WHERE phone = $1`, [
    "admin",
  ]);

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE "User" SET password = $1, role = $2, "updatedAt" = NOW() WHERE phone = $3`,
      [hashedPassword, "admin", "admin"],
    );
    console.log("Admin user updated with bcrypt password and admin role");
  } else {
    const result = await pool.query(
      `INSERT INTO "User" (phone, password, name, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, phone, name, role`,
      ["admin", hashedPassword, "Admin", "admin"],
    );
    console.log("Admin user created:", result.rows[0]);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
