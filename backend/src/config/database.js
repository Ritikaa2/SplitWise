const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "sql12.freesqldatabase.com",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "sql12830435",
  password: process.env.DB_PASSWORD || "s89tW4nbdB",
  database: process.env.DB_NAME || "sql12830435",

  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: true,
  multipleStatements: true,
});

module.exports = pool;
