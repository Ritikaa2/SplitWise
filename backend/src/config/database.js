const { AsyncLocalStorage } = require("node:async_hooks");
const mysql = require("mysql2/promise");
const { hashPassword } = require("../utils/security");
const { convertToInr, round2 } = require("../utils/money");

const DB_CONFIG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "splitwise_pro",
};

let pool;
const transactionStore = new AsyncLocalStorage();

function normalizeSql(sql) {
  return String(sql)
    .replace(/(?<!`)\bgroups\b(?!`)/g, "`groups`")
    .replace(/\bINSERT OR IGNORE INTO\b/gi, "INSERT IGNORE INTO");
}

function activeClient() {
  if (!pool) throw new Error("Database has not been initialized");
  return transactionStore.getStore() || pool;
}

async function execute(sql, params = []) {
  const [result] = await activeClient().execute(normalizeSql(sql), params);
  return result;
}

const db = {
  prepare(sql) {
    return {
      async all(...params) {
        return execute(sql, params);
      },
      async get(...params) {
        const rows = await execute(sql, params);
        return rows[0] || null;
      },
      async run(...params) {
        const result = await execute(sql, params);
        return {
          lastInsertRowid: result.insertId,
          changes: result.affectedRows,
        };
      },
    };
  },
  async exec(sql) {
    await activeClient().query(normalizeSql(sql));
  },
};

async function createPool() {
  const bootstrap = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    multipleStatements: true,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await bootstrap.end();

  pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    decimalNumbers: true,
    dateStrings: true,
    multipleStatements: true,
  });
}

async function runInTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await transactionStore.run(connection, work);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function assertIdentifier(value) {
  if (!/^[a-z_]+$/i.test(value)) throw new Error(`Unsafe SQL identifier: ${value}`);
}

async function addColumnIfMissing(table, column, definition) {
  assertIdentifier(table);
  assertIdentifier(column);
  const rows = await db.prepare(
    "SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
  ).all(table, column);
  if (!rows.length) await db.exec(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

async function initDb() {
  await db.exec(`
   CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(191) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NULL,
  consumed_at TIMESTAMP NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS currencies (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  rate_to_inr DECIMAL(15,6) NOT NULL DEFAULT 1,
  precision_digits INT NOT NULL DEFAULT 2,
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `groups` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  description TEXT,
  default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  emoji VARCHAR(50) NOT NULL DEFAULT 'Wallet',
  created_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  converted_amount_inr DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  paid_by_id INT NOT NULL,
  split_type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  merchant VARCHAR(191) NOT NULL DEFAULT '',
  is_recurring TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  FOREIGN KEY(group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY(paid_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  payer_id INT NOT NULL,
  payee_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  converted_amount_inr DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP NULL,
  FOREIGN KEY(group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY(payer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(payee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  monthly_limit DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  created_at TIMESTAMP NULL,
  FOREIGN KEY(group_id) REFERENCES `groups`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS import_sessions (
  id VARCHAR(191) PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'VALIDATED',
  rows_count INT NOT NULL DEFAULT 0,
  imported_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  FOREIGN KEY(group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS import_rows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(191) NOT NULL,
  row_number INT NOT NULL,
  raw_data LONGTEXT NOT NULL,
  row_hash VARCHAR(64) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  action_taken VARCHAR(50) NULL,
  created_expense_id INT NULL,
  created_at TIMESTAMP NULL,
  FOREIGN KEY(session_id) REFERENCES import_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(created_expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
  UNIQUE KEY uq_import_row (session_id, row_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS import_anomalies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(191) NOT NULL,
  row_number INT NOT NULL,
  field_name VARCHAR(100),
  issue VARCHAR(500) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  recommended_action VARCHAR(50) NOT NULL DEFAULT 'REVIEW',
  action_taken VARCHAR(50) NULL,
  raw_data LONGTEXT NOT NULL,
  resolved TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY(session_id) REFERENCES import_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(191) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT NULL,
  details TEXT,
  timestamp TIMESTAMP NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`);

  await addColumnIfMissing("groups", "emoji", "VARCHAR(50) NOT NULL DEFAULT 'Wallet'");
  await addColumnIfMissing("expenses", "category", "VARCHAR(100) NOT NULL DEFAULT 'General'");
  await addColumnIfMissing("expenses", "merchant", "VARCHAR(255) NOT NULL DEFAULT ''");
  await addColumnIfMissing("expenses", "is_recurring", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfMissing("import_sessions", "rows_count", "INT NOT NULL DEFAULT 0");
  await addColumnIfMissing("import_sessions", "imported_count", "INT NOT NULL DEFAULT 0");
  await addColumnIfMissing("import_sessions", "skipped_count", "INT NOT NULL DEFAULT 0");
  await addColumnIfMissing("import_anomalies", "recommended_action", "VARCHAR(50) NOT NULL DEFAULT 'REVIEW'");
  await addColumnIfMissing("import_anomalies", "action_taken", "VARCHAR(50) NULL");

  await db.prepare(`
    INSERT INTO currencies (code, name, symbol, rate_to_inr, precision_digits, active)
    VALUES
      ('INR', 'Indian Rupee', 'INR', 1.000000, 2, 1),
      ('USD', 'US Dollar', 'USD', 83.000000, 2, 1)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      symbol = VALUES(symbol),
      rate_to_inr = VALUES(rate_to_inr),
      precision_digits = VALUES(precision_digits),
      active = VALUES(active)
  `).run();
}

async function seedDemoData() {
  const seeded = (await db.prepare(`
    SELECT COUNT(*) AS count
    FROM \`groups\`
    WHERE name IN ('Home Circle', 'Goa Weekend', 'Studio Snacks', 'Tech Summit 2026')
  `).get()).count;
  if (seeded >= 4) return;

  const insertUser = db.prepare("INSERT IGNORE INTO users (name, email, hashed_password) VALUES (?, ?, ?)");
  const users = [
    ["Aisha Kapoor", "aisha@example.com"],
    ["Rohan Mehta", "rohan@example.com"],
    ["Priya Nair", "priya@example.com"],
    ["Sam Dsouza", "sam@example.com"],
    ["Meera Shah", "meera@example.com"],
    ["Arjun Verma", "arjun@example.com"],
    ["Sneha Reddy", "sneha@example.com"],
  ];
  const userIds = new Map();

  await runInTransaction(async () => {
    for (const [name, email] of users) {
      await insertUser.run(name, email, hashPassword("password123"));
      userIds.set(email, (await db.prepare("SELECT id FROM users WHERE email = ?").get(email)).id);
    }

    const groups = [
      ["Home Circle", "Everyday bills for people who share a kitchen, a calendar and a lot of small payments.", "INR", "Home"],
      ["Goa Weekend", "A friendly trip tab with rooms, fuel, food and a couple of card payments in USD.", "INR", "Plane"],
      ["Studio Snacks", "Lunches, subscriptions and supplies for a small creative team.", "INR", "Briefcase"],
      ["Tech Summit 2026", "Business travel, registration fees, and networking events for the annual conference.", "USD", "Laptop"],
    ];
    const insertGroup = db.prepare("INSERT INTO `groups` (name, description, default_currency, emoji) VALUES (?, ?, ?, ?)");
    const insertMember = db.prepare("INSERT INTO group_members (group_id, user_id, joined_at, left_at) VALUES (?, ?, ?, ?)");
    const insertBudget = db.prepare("INSERT INTO budgets (group_id, category, monthly_limit, currency) VALUES (?, ?, ?, ?)");
    const groupIds = [];
    for (const group of groups) {
      const existing = await db.prepare("SELECT id FROM `groups` WHERE name = ?").get(group[0]);
      groupIds.push(existing ? existing.id : Number((await insertGroup.run(...group)).lastInsertRowid));
    }

    for (const groupId of groupIds) {
      for (const [email, joinedAt] of [["aisha@example.com", "2026-01-01"], ["rohan@example.com", "2026-01-01"], ["priya@example.com", "2026-01-10"]]) {
        const exists = await db.prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, userIds.get(email));
        if (!exists) await insertMember.run(groupId, userIds.get(email), joinedAt, null);
      }
    }
    for (const [groupId, email, joinedAt, leftAt] of [
      [groupIds[0], "sam@example.com", "2026-04-15", null],
      [groupIds[0], "meera@example.com", "2026-01-01", "2026-03-31"],
      [groupIds[1], "sam@example.com", "2026-05-01", null],
    ]) {
      const exists = await db.prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, userIds.get(email));
      if (!exists) await insertMember.run(groupId, userIds.get(email), joinedAt, leftAt);
    }

    for (const budget of [
      [groupIds[0], "Rent", 60000, "INR"],
      [groupIds[0], "Groceries", 22000, "INR"],
      [groupIds[0], "Utilities", 12000, "INR"],
      [groupIds[1], "Travel", 45000, "INR"],
      [groupIds[2], "Office", 18000, "INR"],
    ]) {
      await insertBudget.run(...budget);
    }

    const expenses = [
      [groupIds[0], "June rent", "Shared apartment rent", 60000, "INR", "2026-06-03", userIds.get("aisha@example.com"), "EQUAL", "Rent", "Owner transfer", 1, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[0], "Weekend groceries", "BigBasket monthly refill", 7420, "INR", "2026-06-08", userIds.get("rohan@example.com"), "EQUAL", "Groceries", "BigBasket", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[0], "Electricity bill", "April to May cycle", 5120, "INR", "2026-05-24", userIds.get("priya@example.com"), "EQUAL", "Utilities", "BESCOM", 1, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[0], "Cleaning supplies", "Detergent, mop and kitchen stock", 1890, "INR", "2026-06-10", userIds.get("sam@example.com"), "EQUAL", "Home", "DMart", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[1], "Beach villa deposit", "Two-night stay", 18000, "INR", "2026-05-18", userIds.get("priya@example.com"), "EQUAL", "Travel", "Casa Marina", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[1], "Cafe card swipe", "USD payment converted to INR", 86, "USD", "2026-05-19", userIds.get("aisha@example.com"), "EQUAL", "Food", "Salt Cafe", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[2], "Figma subscription", "Team design subscription", 120, "USD", "2026-06-01", userIds.get("rohan@example.com"), "EQUAL", "Software", "Figma", 1, ["aisha@example.com", "rohan@example.com", "priya@example.com"]],
      [groupIds[2], "Client lunch", "Discovery workshop", 4850, "INR", "2026-06-06", userIds.get("priya@example.com"), "EQUAL", "Meals", "Olive Bistro", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com"]],
      [groupIds[3], "Summit Pass", "Early bird tickets", 1500, "USD", "2026-06-10", userIds.get("arjun@example.com"), "EQUAL", "Education", "Eventbrite", 0, ["aisha@example.com", "arjun@example.com", "sneha@example.com"]],
      [groupIds[3], "Hotel Hilton", "3-night corporate stay", 900, "USD", "2026-06-12", userIds.get("sneha@example.com"), "EQUAL", "Travel", "Hilton", 0, ["aisha@example.com", "arjun@example.com", "sneha@example.com"]],
      [groupIds[0], "High-speed Fiber", "Airtel Monthly", 1200, "INR", "2026-06-14", userIds.get("rohan@example.com"), "EQUAL", "Utilities", "Airtel", 1, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[0], "Zomato Party", "Friday night pizza", 2400, "INR", "2026-06-13", userIds.get("aisha@example.com"), "PERCENTAGE", "Food", "Zomato", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com"]],
    ];

    for (const expense of expenses) {
      const [groupId, title, description, amount, currency, date, paidById, splitType, category, merchant, isRecurring, emails] = expense;
      const converted = convertToInr(amount, currency);
      const result = await db.prepare(`
        INSERT INTO expenses (group_id, title, description, amount, currency, converted_amount_inr, date, paid_by_id, split_type, category, merchant, is_recurring)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(groupId, title, description, amount, currency, converted, date, paidById, splitType, category, merchant, isRecurring);
      const expenseId = Number(result.lastInsertRowid);
      const share = round2(Number(amount) / emails.length);
      for (const [index, email] of emails.entries()) {
        const amountOwed = index === emails.length - 1 ? round2(Number(amount) - share * (emails.length - 1)) : share;
        await db.prepare("INSERT INTO expense_participants (expense_id, user_id, amount_owed, share_value) VALUES (?, ?, ?, ?)")
          .run(expenseId, userIds.get(email), amountOwed, null);
      }
    }

    await db.prepare(`
      INSERT INTO settlements (group_id, payer_id, payee_id, amount, currency, converted_amount_inr, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(groupIds[0], userIds.get("rohan@example.com"), userIds.get("aisha@example.com"), 5000, "INR", 5000, "2026-06-12");

    await db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (?, 'DEMO_SEEDED', 'system', ?)")
      .run(userIds.get("aisha@example.com"), "Demo workspace created with users, groups, budgets, expenses and one settlement.");
  });
}

async function initDatabase() {
  if (pool) return;
  await createPool();
  await initDb();
  await seedDemoData();
}

module.exports = { db, DB_CONFIG, initDatabase, runInTransaction };
