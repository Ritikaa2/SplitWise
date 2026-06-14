const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { hashPassword } = require("../utils/security");
const { convertToInr, round2 } = require("../utils/money");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "..", "data");
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, "splitwise.sqlite");

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON");

function addColumnIfMissing(table, column, definition) {
  const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((item) => item.name === column);
  if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      hashed_password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      default_currency TEXT NOT NULL DEFAULT 'INR',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TEXT NOT NULL,
      left_at TEXT,
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      converted_amount_inr REAL NOT NULL,
      date TEXT NOT NULL,
      paid_by_id INTEGER NOT NULL,
      split_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY(paid_by_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expense_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount_owed REAL NOT NULL,
      share_value REAL,
      FOREIGN KEY(expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      payer_id INTEGER NOT NULL,
      payee_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      converted_amount_inr REAL NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY(payer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(payee_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS import_sessions (
      id TEXT PRIMARY KEY,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'VALIDATED',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS import_anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      row_number INTEGER NOT NULL,
      field_name TEXT,
      issue TEXT NOT NULL,
      severity TEXT NOT NULL,
      raw_data TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(session_id) REFERENCES import_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  addColumnIfMissing("groups", "emoji", "TEXT NOT NULL DEFAULT 'Wallet'");
  addColumnIfMissing("expenses", "category", "TEXT NOT NULL DEFAULT 'General'");
  addColumnIfMissing("expenses", "merchant", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing("expenses", "is_recurring", "INTEGER NOT NULL DEFAULT 0");
}

function seedDemoData() {
  const seeded = db.prepare(`
    SELECT COUNT(*) AS count
    FROM groups
    WHERE name IN ('Home Circle', 'Goa Weekend', 'Studio Snacks')
  `).get().count;
  if (seeded >= 3) return;

  const insertUser = db.prepare("INSERT OR IGNORE INTO users (name, email, hashed_password) VALUES (?, ?, ?)");
  const users = [
    ["Aisha Kapoor", "aisha@example.com"],
    ["Rohan Mehta", "rohan@example.com"],
    ["Priya Nair", "priya@example.com"],
    ["Sam Dsouza", "sam@example.com"],
    ["Meera Shah", "meera@example.com"],
  ];
  const userIds = new Map();

  const tx = db.transaction(() => {
    for (const [name, email] of users) {
      insertUser.run(name, email, hashPassword("password123"));
      userIds.set(email, db.prepare("SELECT id FROM users WHERE email = ?").get(email).id);
    }

    const groups = [
      ["Home Circle", "Everyday bills for people who share a kitchen, a calendar and a lot of small payments.", "INR", "Home"],
      ["Goa Weekend", "A friendly trip tab with rooms, fuel, food and a couple of card payments in USD.", "INR", "Plane"],
      ["Studio Snacks", "Lunches, subscriptions and supplies for a small creative team.", "INR", "Briefcase"],
    ];
    const insertGroup = db.prepare("INSERT INTO groups (name, description, default_currency, emoji) VALUES (?, ?, ?, ?)");
    const insertMember = db.prepare("INSERT INTO group_members (group_id, user_id, joined_at, left_at) VALUES (?, ?, ?, ?)");
    const insertBudget = db.prepare("INSERT INTO budgets (group_id, category, monthly_limit, currency) VALUES (?, ?, ?, ?)");
    const groupIds = [];
    groups.forEach((group) => {
      const existing = db.prepare("SELECT id FROM groups WHERE name = ?").get(group[0]);
      groupIds.push(existing ? existing.id : Number(insertGroup.run(...group).lastInsertRowid));
    });

    for (const groupId of groupIds) {
      for (const [email, joinedAt] of [["aisha@example.com", "2026-01-01"], ["rohan@example.com", "2026-01-01"], ["priya@example.com", "2026-01-10"]]) {
        const exists = db.prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, userIds.get(email));
        if (!exists) insertMember.run(groupId, userIds.get(email), joinedAt, null);
      }
    }
    [
      [groupIds[0], "sam@example.com", "2026-04-15", null],
      [groupIds[0], "meera@example.com", "2026-01-01", "2026-03-31"],
      [groupIds[1], "sam@example.com", "2026-05-01", null],
    ].forEach(([groupId, email, joinedAt, leftAt]) => {
      const exists = db.prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, userIds.get(email));
      if (!exists) insertMember.run(groupId, userIds.get(email), joinedAt, leftAt);
    });

    [
      [groupIds[0], "Rent", 60000, "INR"],
      [groupIds[0], "Groceries", 22000, "INR"],
      [groupIds[0], "Utilities", 12000, "INR"],
      [groupIds[1], "Travel", 45000, "INR"],
      [groupIds[2], "Office", 18000, "INR"],
    ].forEach((budget) => insertBudget.run(...budget));

    const expenses = [
      [groupIds[0], "June rent", "Shared apartment rent", 60000, "INR", "2026-06-03", userIds.get("aisha@example.com"), "EQUAL", "Rent", "Owner transfer", 1, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[0], "Weekend groceries", "BigBasket monthly refill", 7420, "INR", "2026-06-08", userIds.get("rohan@example.com"), "EQUAL", "Groceries", "BigBasket", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[0], "Electricity bill", "April to May cycle", 5120, "INR", "2026-05-24", userIds.get("priya@example.com"), "EQUAL", "Utilities", "BESCOM", 1, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[0], "Cleaning supplies", "Detergent, mop and kitchen stock", 1890, "INR", "2026-06-10", userIds.get("sam@example.com"), "EQUAL", "Home", "DMart", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[1], "Beach villa deposit", "Two-night stay", 18000, "INR", "2026-05-18", userIds.get("priya@example.com"), "EQUAL", "Travel", "Casa Marina", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[1], "Cafe card swipe", "USD payment converted to INR", 86, "USD", "2026-05-19", userIds.get("aisha@example.com"), "EQUAL", "Food", "Salt Cafe", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com", "sam@example.com"]],
      [groupIds[2], "Figma subscription", "Team design subscription", 120, "USD", "2026-06-01", userIds.get("rohan@example.com"), "EQUAL", "Software", "Figma", 1, ["aisha@example.com", "rohan@example.com", "priya@example.com"]],
      [groupIds[2], "Client lunch", "Discovery workshop", 4850, "INR", "2026-06-06", userIds.get("priya@example.com"), "EQUAL", "Meals", "Olive Bistro", 0, ["aisha@example.com", "rohan@example.com", "priya@example.com"]],
    ];

    for (const expense of expenses) {
      const [groupId, title, description, amount, currency, date, paidById, splitType, category, merchant, isRecurring, emails] = expense;
      const converted = convertToInr(amount, currency);
      const result = db.prepare(`
        INSERT INTO expenses (group_id, title, description, amount, currency, converted_amount_inr, date, paid_by_id, split_type, category, merchant, is_recurring)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(groupId, title, description, amount, currency, converted, date, paidById, splitType, category, merchant, isRecurring);
      const expenseId = Number(result.lastInsertRowid);
      const share = round2(Number(amount) / emails.length);
      emails.forEach((email, index) => {
        const amountOwed = index === emails.length - 1 ? round2(Number(amount) - share * (emails.length - 1)) : share;
        db.prepare("INSERT INTO expense_participants (expense_id, user_id, amount_owed, share_value) VALUES (?, ?, ?, ?)")
          .run(expenseId, userIds.get(email), amountOwed, null);
      });
    }

    db.prepare(`
      INSERT INTO settlements (group_id, payer_id, payee_id, amount, currency, converted_amount_inr, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(groupIds[0], userIds.get("rohan@example.com"), userIds.get("aisha@example.com"), 5000, "INR", 5000, "2026-06-12");

    db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (?, 'DEMO_SEEDED', 'system', ?)")
      .run(userIds.get("aisha@example.com"), "Demo workspace created with users, groups, budgets, expenses and one settlement.");
  });

  tx();
}

initDb();
seedDemoData();

module.exports = { db, DB_PATH };
