-- ============================================
-- FINANZAS PERSONALES - Supabase Schema
-- ============================================

-- 1. ACCOUNTS
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '💳',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  is_archived BOOLEAN DEFAULT false
);

-- 2. CATEGORIES
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TRANSACTIONS
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  transfer_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BUDGETS
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (category_id, month, year)
);

-- INDEXES
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_transfer ON transactions(transfer_id);
CREATE INDEX idx_budgets_month_year ON budgets(month, year);

-- SEED: Default Categories
INSERT INTO categories (name, type, icon, color) VALUES
  ('Salario', 'income', '💰', '#10b981'),
  ('Freelance', 'income', '💻', '#3b82f6'),
  ('Inversiones', 'income', '📈', '#8b5cf6'),
  ('Otros ingresos', 'income', '🎁', '#f59e0b'),
  ('Comida', 'expense', '🍔', '#ef4444'),
  ('Transporte', 'expense', '🚗', '#f97316'),
  ('Vivienda', 'expense', '🏠', '#6366f1'),
  ('Servicios', 'expense', '⚡', '#eab308'),
  ('Salud', 'expense', '🏥', '#ec4899'),
  ('Entretenimiento', 'expense', '🎬', '#a855f7'),
  ('Ropa', 'expense', '👕', '#14b8a6'),
  ('Educación', 'expense', '📚', '#0ea5e9'),
  ('Suscripciones', 'expense', '📱', '#f43f5e'),
  ('Otros gastos', 'expense', '📦', '#6b7280');

-- SEED: Default Accounts
INSERT INTO accounts (name, icon, color) VALUES
  ('Nequi', '💜', '#7c3aed'),
  ('Bancolombia', '🏦', '#f59e0b'),
  ('Efectivo', '💵', '#10b981');

-- VIEW: Account balances calculated from transactions
CREATE OR REPLACE VIEW account_balances AS
SELECT
  a.id,
  a.name,
  a.icon,
  a.color,
  a.is_archived,
  COALESCE(
    SUM(CASE WHEN t.type IN ('income', 'transfer') AND t.account_id = a.id THEN t.amount ELSE 0 END) -
    SUM(CASE WHEN t.type IN ('expense', 'transfer') AND t.account_id = a.id THEN t.amount ELSE 0 END),
    0
  ) AS balance
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id
GROUP BY a.id, a.name, a.icon, a.color, a.is_archived;

-- Corrected view: properly calculate balance
DROP VIEW IF EXISTS account_balances;
CREATE OR REPLACE VIEW account_balances AS
SELECT
  a.id,
  a.name,
  a.icon,
  a.color,
  a.is_archived,
  COALESCE(
    (SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'income') -
    (SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'expense'),
    0
  )::NUMERIC(15,2) AS balance
FROM accounts a;
