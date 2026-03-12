// Usage: node create-admin.js <email> <password>
// Example: node create-admin.js admin@mnuac.edu.mn SecurePassword123

const { createAdmin } = require("./src/services/adminAuthService");

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: node create-admin.js <email> <password>");
    process.exit(1);
  }

  try {
    const admin = await createAdmin(email, password);
    console.log("Admin created successfully:");
    console.log(`  ID: ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log("\nNext: Login and set up TOTP via the admin panel.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
