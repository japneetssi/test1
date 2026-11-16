-- Migration to add time_horizon, category, and step_up_percentage to goals table

ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS time_horizon VARCHAR(20) CHECK (time_horizon IN ('short-term', 'medium-term', 'long-term')),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS step_up_percentage DECIMAL(5,2) DEFAULT 0;
