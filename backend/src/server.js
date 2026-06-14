const app = require("./app");
const { DB_CONFIG, initDatabase } = require("./config/database");

const PORT = Number(process.env.PORT || 8000);

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`SplitWise Pro Express API running at http://localhost:${PORT}`);
    console.log(`MySQL database: ${DB_CONFIG.user}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  });
}

start().catch((error) => {
  console.error("Failed to start SplitWise Pro API");
  console.error(error);
  process.exit(1);
});
