
-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Groups
CREATE TABLE IF NOT EXISTS `groups` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_currency VARCHAR(10) DEFAULT 'INR',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at DATE NOT NULL,
  left_at DATE NULL,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member (group_id, user_id, joined_at)
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  converted_amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  paid_by INT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Expense Splits
CREATE TABLE IF NOT EXISTS expense_splits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  share_type ENUM('EQUAL','EXACT','PERCENTAGE') DEFAULT 'EQUAL',
  share_value DECIMAL(15,2) NULL,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Settlements
CREATE TABLE IF NOT EXISTS settlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  paid_by INT NOT NULL,
  paid_to INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  converted_amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (paid_to) REFERENCES users(id) ON DELETE CASCADE
);

-- Currencies
CREATE TABLE IF NOT EXISTS currencies (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  rate DECIMAL(15,6) NOT NULL DEFAULT 1
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(15,6) NOT NULL,
  date DATE NOT NULL,
  UNIQUE KEY unique_rate (from_currency, to_currency, date)
);

-- Import Logs
CREATE TABLE IF NOT EXISTS import_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  total_rows INT DEFAULT 0,
  imported INT DEFAULT 0,
  skipped INT DEFAULT 0,
  status ENUM('PROCESSING','COMPLETED','FAILED') DEFAULT 'PROCESSING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Anomaly Logs
CREATE TABLE IF NOT EXISTS anomaly_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  import_id INT NOT NULL,
  row_number INT NOT NULL,
  field VARCHAR(100),
  issue TEXT NOT NULL,
  severity ENUM('WARNING','ERROR') DEFAULT 'WARNING',
  suggested_action ENUM('KEEP_ORIGINAL','KEEP_NEW','MERGE','IGNORE') DEFAULT 'KEEP_NEW',
  FOREIGN KEY (import_id) REFERENCES import_logs(id) ON DELETE CASCADE
);

-- Seed currencies
INSERT IGNORE INTO currencies (code, name, symbol, rate) VALUES
('INR', 'Indian Rupee', '₹', 1),
('USD', 'US Dollar', '$', 83);
-- Seed exchange rates
INSERT IGNORE INTO exchange_rates (from_currency, to_currency, rate, date) VALUES
('USD', 'INR', 83, CURDATE()),
('INR', 'USD', 0.012, CURDATE());

-- Password reset OTPs
CREATE TABLE IF NOT EXISTS password_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_expires (user_id, expires_at)
);

-- Demo users are seeded on server startup with a valid bcrypt hash for password123
