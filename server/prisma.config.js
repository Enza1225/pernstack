const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

module.exports = {
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
