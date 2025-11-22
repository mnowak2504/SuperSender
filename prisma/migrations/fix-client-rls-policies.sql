-- ============================================
-- FIX RLS (Row Level Security) POLICIES FOR CLIENT TABLE
-- Run this in Supabase SQL Editor to allow clients to update their own records
-- ============================================
-- 
-- NOTE: This application uses NextAuth (not Supabase Auth) and all database
-- operations are performed through API routes using the service_role key.
-- Therefore, we can safely disable RLS for the Client table.

-- Check if RLS is enabled on Client table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'Client';

-- ============================================
-- OPTION 1: DISABLE RLS FOR CLIENT TABLE (Recommended for this setup)
-- ============================================
-- Since all operations go through API routes with service_role key,
-- disabling RLS is the simplest solution:
ALTER TABLE "Client" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION 2: CREATE POLICY FOR SERVICE ROLE (Alternative approach)
-- ============================================
-- If you prefer to keep RLS enabled, uncomment the following:

-- ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
-- 
-- -- Drop existing policies if they exist (to avoid conflicts)
-- DROP POLICY IF EXISTS "Allow service role full access to Client" ON "Client";
-- 
-- -- Policy: Allow service role (your Next.js app) full access to Client table
-- -- This is needed because your API routes use the service role key
-- CREATE POLICY "Allow service role full access to Client"
-- ON "Client"
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- ============================================
-- VERIFY RLS STATUS
-- ============================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'Client';

-- If RLS is enabled, verify policies:
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd
-- FROM pg_policies 
-- WHERE tablename = 'Client'
-- ORDER BY policyname;
