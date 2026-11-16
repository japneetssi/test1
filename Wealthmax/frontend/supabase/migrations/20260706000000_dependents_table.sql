-- ============================================================
-- Safety Net Dependents Table
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_net_dependents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    safety_net_id UUID NOT NULL REFERENCES safety_nets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    income NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_net_dependents_safety_net_id ON safety_net_dependents(safety_net_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_safety_net_dependents_modtime BEFORE UPDATE ON safety_net_dependents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security
ALTER TABLE safety_net_dependents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own safety net dependents" ON safety_net_dependents FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM safety_nets s WHERE s.id = safety_net_dependents.safety_net_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can insert their own safety net dependents" ON safety_net_dependents FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM safety_nets s WHERE s.id = safety_net_dependents.safety_net_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can update their own safety net dependents" ON safety_net_dependents FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM safety_nets s WHERE s.id = safety_net_dependents.safety_net_id AND s.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM safety_nets s WHERE s.id = safety_net_dependents.safety_net_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can delete their own safety net dependents" ON safety_net_dependents FOR DELETE TO authenticated 
    USING (EXISTS (SELECT 1 FROM safety_nets s WHERE s.id = safety_net_dependents.safety_net_id AND s.user_id = auth.uid()));

CREATE POLICY "Service role full access safety_net_dependents" ON safety_net_dependents FOR ALL TO service_role USING (true) WITH CHECK (true);
