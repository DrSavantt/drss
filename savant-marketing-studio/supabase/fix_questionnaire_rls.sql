-- ============================================
-- FIX QUESTIONNAIRE CONFIG RLS POLICIES
-- ============================================
-- This script checks and fixes RLS policies for questionnaire config tables
-- These tables contain non-sensitive configuration data and should be readable
-- by authenticated users (internal staff viewing the questionnaire)

-- Step 1: Check current RLS status
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'questionnaire%'
ORDER BY tablename;

-- Step 2: Check existing policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE 'questionnaire%'
ORDER BY tablename, policyname;

-- Step 3: Enable RLS on all questionnaire tables (if not already enabled)
ALTER TABLE questionnaire_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_help ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (for clean slate)
DROP POLICY IF EXISTS "Allow authenticated read access to sections" ON questionnaire_sections;
DROP POLICY IF EXISTS "Allow authenticated read access to questions" ON questionnaire_questions;
DROP POLICY IF EXISTS "Allow authenticated read access to help" ON questionnaire_help;

-- Step 5: Create read policies for authenticated users (internal staff)
-- These allow anyone logged into the dashboard to read the questionnaire config

CREATE POLICY "Allow authenticated read access to sections"
ON questionnaire_sections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access to questions"
ON questionnaire_questions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read access to help"
ON questionnaire_help FOR SELECT
TO authenticated
USING (true);

-- Step 6: Verify policies were created
SELECT 
  tablename,
  policyname,
  roles::text[],
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'No restriction'
  END as policy_condition
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE 'questionnaire%'
ORDER BY tablename, policyname;

-- Expected output:
-- questionnaire_sections | Allow authenticated read access to sections | {authenticated} | SELECT | USING: true
-- questionnaire_questions | Allow authenticated read access to questions | {authenticated} | SELECT | USING: true
-- questionnaire_help | Allow authenticated read access to help | {authenticated} | SELECT | USING: true

