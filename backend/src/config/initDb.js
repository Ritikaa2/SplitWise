const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function initDb(pool) {
  const schemaPath = path.join(__dirname, "../../schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schema);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_otps (
     
    )
  `);

  const demoHash = await bcrypt.hash("password123", 10);
  const demoUsers = [
    ["Aisha Kapoor", "aisha@example.com"],
    ["Rohan Mehta", "rohan@example.com"],
    ["Priya Nair", "priya@example.com"],
  ];

  for (const [name, email] of demoUsers) {
    await pool.query(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [name, email, demoHash]
    );
  }

  console.log("✅ Database schema initialized");
}

module.exports = initDb;
