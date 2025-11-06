-- ============================================
-- FIX RLS (Row Level Security) POLICIES
-- Run this in Supabase SQL Editor if users cannot be created
-- ============================================
-- 
-- Supabase by default enables RLS on all tables.
-- This can block INSERT operations from your application.
-- 
-- Option 1: Disable RLS for User table (for development)
-- Option 2: Create a policy that allows inserts (recommended for production)

-- ============================================
-- OPTION 1: DISABLE RLS (Quick fix for development)
-- ============================================
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION 2: CREATE POLICY FOR INSERTS (Better for production)
-- ============================================
-- First, re-enable RLS if you disabled it:
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Then create a policy that allows service role (your app) to insert users:
-- CREATE POLICY "Allow service role to insert users"
-- ON "User"
-- FOR INSERT
-- TO service_role
-- WITH CHECK (true);

-- Or allow authenticated inserts (if using Supabase Auth):
-- CREATE POLICY "Allow authenticated users to insert users"
-- ON "User"
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (true);

-- ============================================
-- CHECK CURRENT RLS STATUS
-- ============================================
-- Run this to see if RLS is enabled:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'User';

-- ============================================
-- LIST EXISTING POLICIES
-- ============================================
-- Run this to see existing policies on User table:
SELECT * FROM pg_policies WHERE tablename = 'User';

