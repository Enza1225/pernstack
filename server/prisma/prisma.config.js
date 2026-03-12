const path = require("path");
const { defineConfig } = require("prisma/config");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

module.exports = defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
