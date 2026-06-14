const mysql = require("mysql2/promise");
require("dotenv").config();

const DB_CONFIG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "splitwise",
};

async function createPool() {
  // First connect without database to create it if needed
  const conn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    multipleStatements: true,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();

  const pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
    dateStrings: true,
    multipleStatements: true,
  });
  return pool;
}

const poolPromise = createPool();

module.exports = poolPromise;