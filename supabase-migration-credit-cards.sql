-- ============================================
-- MIGRATION: Credit Card Support
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add account_type and credit_limit to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'bank' CHECK (account_type IN ('bank', 'cash', 'credit_card'));
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15, 2) DEFAULT 0;

-- 2. Update existing accounts to proper types
-- (Optional: adjust these based on your actual accounts)
UPDATE accounts SET account_type = 'cash' WHERE LOWER(name) = 'efectivo';

-- 3. Recreate balance view with credit card support
DROP VIEW IF EXISTS account_balances;
CREATE OR REPLACE VIEW account_balances AS
SELECT
  a.id,
  a.name,
  a.icon,
  a.color,
  a.is_archived,
  a.account_type,
  a.credit_limit,
  (
    COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'income'), 0) -
    COALESCE((SELECT SUM(amount) FROM transactions WHERE account_id = a.id AND type = 'expense'), 0)
  )::NUMERIC(15,2) AS balance
FROM accounts a;

-- Notes:
-- For credit cards, balance will be negative (debt) when you spend.
-- When you pay the card (transfer from bank -> card), it creates:
--   expense on bank account (reduces bank balance)
--   income on credit card (reduces debt / increases balance toward 0)
-- credit_limit - ABS(balance) = available credit
