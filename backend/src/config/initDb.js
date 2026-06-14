const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function initDb(pool) {
  const schemaPath = path.join(__dirname, "../../schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schema);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_expires (user_id, expires_at)
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
