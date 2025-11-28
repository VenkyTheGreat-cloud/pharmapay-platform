-- ============================================
-- COPY THIS ENTIRE FILE AND PASTE INTO YOUR DATABASE
-- This will fix the role constraint error
-- ============================================

BEGIN;

-- Step 1: Fix any invalid role values
UPDATE users
SET role = 'store_manager', updated_at = CURRENT_TIMESTAMP
WHERE role IS NULL 
   OR role = ''
   OR TRIM(role) = ''
   OR role NOT IN ('admin', 'store_manager');

-- Step 2: Remove ALL existing role constraints
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND (
            conname LIKE '%role%' 
            OR pg_get_constraintdef(oid) LIKE '%role%'
        )
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name) || ' CASCADE';
    END LOOP;
END $$;

-- Step 3: Add the correct constraint
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'store_manager'));

COMMIT;

-- Step 4: Verify it worked
SELECT 
    'SUCCESS! Constraint is now:' as status,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Step 5: Show current roles (should only be admin and store_manager)
SELECT 'Current roles in database:' as info;
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;

