-- ============================================================
-- WealthMax Database Migration - Create Goals Table
-- Date: 2026-03-10
-- ============================================================

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    target_date DATE NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    monthly_contribution DECIMAL(15,2) DEFAULT 0,
    priority VARCHAR(50) DEFAULT 'Medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for user_id for faster goal retrieval
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
