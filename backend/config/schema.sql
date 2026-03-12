-- Expense Tracker & Budget Planner Database Schema
-- Run this file to set up your MySQL database

CREATE DATABASE IF NOT EXISTS expense_tracker;
USE expense_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'bi-tag',
  color VARCHAR(20) DEFAULT '#6c757d',
  type ENUM('expense', 'income', 'both') DEFAULT 'expense',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Default categories (shared across users — user_id is NULL)
INSERT IGNORE INTO categories (user_id, name, icon, color, type, is_default) VALUES
  (NULL, 'Food & Dining', 'bi-cup-hot', '#e74c3c', 'expense', TRUE),
  (NULL, 'Transportation', 'bi-car-front', '#3498db', 'expense', TRUE),
  (NULL, 'Shopping', 'bi-bag', '#9b59b6', 'expense', TRUE),
  (NULL, 'Entertainment', 'bi-film', '#f39c12', 'expense', TRUE),
  (NULL, 'Healthcare', 'bi-heart-pulse', '#e91e63', 'expense', TRUE),
  (NULL, 'Utilities', 'bi-lightning', '#00bcd4', 'expense', TRUE),
  (NULL, 'Housing', 'bi-house', '#795548', 'expense', TRUE),
  (NULL, 'Education', 'bi-book', '#607d8b', 'expense', TRUE),
  (NULL, 'Travel', 'bi-airplane', '#ff5722', 'expense', TRUE),
  (NULL, 'Personal Care', 'bi-person', '#8bc34a', 'expense', TRUE),
  (NULL, 'Salary', 'bi-cash-stack', '#27ae60', 'income', TRUE),
  (NULL, 'Freelance', 'bi-laptop', '#2ecc71', 'income', TRUE),
  (NULL, 'Investment', 'bi-graph-up-arrow', '#1abc9c', 'income', TRUE),
  (NULL, 'Other Income', 'bi-plus-circle', '#16a085', 'income', TRUE),
  (NULL, 'Other Expense', 'bi-three-dots', '#95a5a6', 'expense', TRUE);

-- Expenses / Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT,
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
  date DATE NOT NULL,
  notes TEXT,
  payment_method ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer', 'other') DEFAULT 'cash',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_user_date (user_id, date),
  INDEX idx_user_type (user_id, type),
  INDEX idx_user_category (user_id, category_id)
);

-- Budget Goals table
CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT,
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_budget (user_id, category_id, month, year),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Optimized view for dashboard queries (reduces load time)
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  t.user_id,
  YEAR(t.date) AS year,
  MONTH(t.date) AS month,
  t.type,
  c.name AS category_name,
  c.color AS category_color,
  c.icon AS category_icon,
  SUM(t.amount) AS total,
  COUNT(t.id) AS count
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
GROUP BY t.user_id, YEAR(t.date), MONTH(t.date), t.type, t.category_id;
