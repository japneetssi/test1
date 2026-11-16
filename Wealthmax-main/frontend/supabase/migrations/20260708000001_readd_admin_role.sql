-- Migration to re-add the 'admin' role to the users_role_check constraint
-- Note: 'super_admin' is being officially renamed to 'admin'.
-- If you need to map existing users back to 'admin', you will need to do that manually based on their email or IDs,
-- since the previous migration mapped them to 'advisor'.

-- 1. Drop the existing CHECK constraint on the role column
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

-- 2. Add the new constraint allowing 'user', 'advisor', and 'admin'
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'advisor', 'admin'));
