-- ============================================================
-- WealthMax Database Migration - Add Total Liabilities Column
-- Date: 2026-03-10
-- ============================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_liabilities DECIMAL(15,2) DEFAULT 0;

-- Optional: Backfill with a proxy if needed, e.g., monthly_emi * 60 (5 years)
-- UPDATE profiles SET total_liabilities = liabilities_emi * 60 WHERE total_liabilities = 0;
