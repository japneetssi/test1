-- Migration to remove redundant roles and map them to standard 'user' or 'advisor' roles

-- 1. Map existing roles to valid roles
UPDATE users
SET role = 'user'
WHERE role IN ('client', 'partner', 'user');

UPDATE users
SET role = 'advisor'
WHERE role IN ('admin', 'super_admin', 'rm', 'relationship_manager', 'advisor');

-- 2. Drop the existing CHECK constraint on the role column
-- We need to find the name of the constraint to drop it, or we can drop it by name if we know it.
-- Since the constraint might not have an explicit name in the init schema, PostgreSQL auto-generates one (e.g. users_role_check).
-- To safely handle this in Supabase, we can use a DO block.
DO $$
DECLARE
    conname text;
BEGIN
    -- Find the constraint name for the role column on the users table
    SELECT con.conname INTO conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'users'
      AND att.attname = 'role'
      AND con.contype = 'c';
      
    IF conname IS NOT NULL THEN
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || conname;
    END IF;
END $$;

-- 3. Update the default value for the role column
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- 4. Add the new constraint allowing only 'user' and 'advisor'
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'advisor'));
