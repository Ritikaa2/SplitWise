-- SplitWise Pro Database Schema Setup

CREATE DATABASE IF NOT EXISTS splitwise_pro;
USE splitwise_pro;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Groups Table
CREATE TABLE IF NOT EXISTS `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    emoji VARCHAR(50) NOT NULL DEFAULT 'Wallet',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at DATE NOT NULL,
    left_at DATE NULL,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_member_group_user (group_id, user_id),
    UNIQUE KEY uq_member_group_user_date (group_id, user_id, joined_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    converted_amount_inr DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    paid_by_id INT NOT NULL,
    split_type VARCHAR(50) NOT NULL, -- EQUAL, EXACT, PERCENTAGE, SHARES
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    merchant VARCHAR(255) NOT NULL DEFAULT '',
    is_recurring TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_expense_group (group_id),
    INDEX idx_expense_date (date),
    INDEX idx_expense_paid_by (paid_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Expense Participants Table
CREATE TABLE IF NOT EXISTS expense_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    user_id INT NOT NULL,
    amount_owed DECIMAL(15, 2) NOT NULL,
    share_value DECIMAL(15, 2) NULL, -- Stores share count, exact amount or percentage
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_participant_expense (expense_id),
    INDEX idx_participant_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Settlements Table
CREATE TABLE IF NOT EXISTS settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    payer_id INT NOT NULL, -- debtor
    payee_id INT NOT NULL, -- creditor
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    converted_amount_inr DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_settlement_group (group_id),
    INDEX idx_settlement_payer (payer_id),
    INDEX idx_settlement_payee (payee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    monthly_limit DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    INDEX idx_budget_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Exchange Rates Table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    effective_date DATE NOT NULL,
    UNIQUE KEY uq_exchange_rate (from_currency, to_currency, effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Import Sessions Table
CREATE TABLE IF NOT EXISTS import_sessions (
    id VARCHAR(255) PRIMARY KEY, -- UUID
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'VALIDATED', -- UPLOADED, VALIDATED, APPROVED, COMPLETED, FAILED
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Import Anomalies Table
CREATE TABLE IF NOT EXISTS import_anomalies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    row_number INT NOT NULL,
    field_name VARCHAR(100) NULL,
    issue VARCHAR(500) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- ERROR, WARNING
    raw_data JSON NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES import_sessions(id) ON DELETE CASCADE,
    INDEX idx_anomaly_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NULL,
    details TEXT,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default exchange rates (USD -> INR: 83.0, INR -> USD: 0.012, USD -> USD: 1.0, INR -> INR: 1.0)
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date) VALUES 
('USD', 'INR', 83.000000, '2026-06-13'),
('INR', 'USD', 0.012048, '2026-06-13')
ON DUPLICATE KEY UPDATE rate=VALUES(rate);
