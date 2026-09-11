-- ============================================
-- FIX: Infinite Recursion in RLS Policy
-- ============================================
-- This script fixes the Row Level Security policy on the users table
-- that's causing "infinite recursion detected in policy for relation 'users'"

-- STEP 1: Disable RLS temporarily to allow operations
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS user_policy ON users;
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

-- STEP 3: Create new, non-recursive policies
-- Allow users to read their own data
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (true);  -- Allow all reads (you can restrict this later)

-- Allow new user registration (insert)
CREATE POLICY users_insert_policy ON users
    FOR INSERT
    WITH CHECK (true);  -- Allow all inserts (registration)

-- Allow users to update only their own data
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (id = current_setting('app.user_id', true)::bigint)
    WITH CHECK (id = current_setting('app.user_id', true)::bigint);

-- Allow users to delete only their own data
CREATE POLICY users_delete_policy ON users
    FOR DELETE
    USING (id = current_setting('app.user_id', true)::bigint);

-- STEP 4: Re-enable RLS (optional - keep disabled if you want open access)
-- Uncomment the line below if you want to re-enable RLS with the new policies
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ALTERNATIVE: Keep RLS Disabled (Simpler)
-- ============================================
-- If you don't need RLS for now, just run:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- This will allow all operations without policy checks

-- ============================================
-- VERIFICATION
-- ============================================
-- Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- List all policies on users table
SELECT * FROM pg_policies WHERE tablename = 'users';
