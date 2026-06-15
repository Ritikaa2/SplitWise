const app = require("./app");
const pool = require("./config/database");
const initDb = require("./config/initDb");

const PORT = process.env.PORT || 8000;

async function start() {
  try {
    await initDb(pool);

    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ API available at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
