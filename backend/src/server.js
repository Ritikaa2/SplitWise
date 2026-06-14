const app = require("./app");
const { DB_PATH } = require("./config/database");

const PORT = Number(process.env.PORT || 8000);

app.listen(PORT, () => {
  console.log(`SplitWise Pro Express API running at http://localhost:${PORT}`);
  console.log(`SQLite database: ${DB_PATH}`);
});
