-- ============================================
-- FIX RLS (Row Level Security) POLICIES FOR CLIENT TABLE
-- Run this in Supabase SQL Editor to allow clients to update their own records
-- ============================================

-- Check if RLS is enabled on Client table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'Client';

-- ============================================
-- OPTION 1: DISABLE RLS FOR CLIENT TABLE (Quick fix for development)
-- ============================================
-- Uncomment the line below if you want to disable RLS completely:
-- ALTER TABLE "Client" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION 2: CREATE POLICIES FOR CLIENT TABLE (Recommended for production)
-- ============================================

-- First, ensure RLS is enabled
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow clients to update their own record" ON "Client";
DROP POLICY IF EXISTS "Allow service role full access to Client" ON "Client";
DROP POLICY IF EXISTS "Allow authenticated users to select their Client" ON "Client";
DROP POLICY IF EXISTS "Allow authenticated users to update their Client" ON "Client";

-- Policy 1: Allow service role (your Next.js app) full access to Client table
-- This is needed because your API routes use the service role key
CREATE POLICY "Allow service role full access to Client"
ON "Client"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Allow authenticated users (clients) to SELECT their own Client record
-- This allows clients to view their own profile
CREATE POLICY "Allow authenticated users to select their Client"
ON "Client"
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT "clientId" 
    FROM "User" 
    WHERE id = auth.uid()
  )
);

-- Policy 3: Allow authenticated users (clients) to UPDATE their own Client record
-- This allows clients to update their own profile information
CREATE POLICY "Allow authenticated users to update their Client"
ON "Client"
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT "clientId" 
    FROM "User" 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT "clientId" 
    FROM "User" 
    WHERE id = auth.uid()
  )
);

-- Policy 4: Allow authenticated users (clients) to INSERT their own Client record
-- This may be needed if clients can create their own records
CREATE POLICY "Allow authenticated users to insert their Client"
ON "Client"
FOR INSERT
TO authenticated
WITH CHECK (
  id IN (
    SELECT "clientId" 
    FROM "User" 
    WHERE id = auth.uid()
  )
);

-- ============================================
-- VERIFY POLICIES WERE CREATED
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'Client'
ORDER BY policyname;

-- ============================================
-- NOTE: If you're using Next.js API routes with service_role key,
-- you may not need the authenticated user policies above.
-- The service_role policy should be sufficient.
-- However, if you're using Supabase Auth directly from the client,
-- you'll need the authenticated user policies.
-- ============================================

