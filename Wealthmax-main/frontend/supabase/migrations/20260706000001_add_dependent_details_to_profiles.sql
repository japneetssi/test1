ALTER TABLE profiles ADD COLUMN dependent_details JSONB DEFAULT '[]'::jsonb;
