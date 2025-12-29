-- ============================================
-- VERIFICATION QUERIES FOR QUESTIONNAIRE RESPONSE MIGRATION
-- Run these after applying the migration to verify everything works
-- ============================================

-- 1. Check tables exist
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('questionnaire_responses', 'client_questionnaire_overrides')
ORDER BY table_name;

-- Expected: 2 rows (both tables)

-- 2. Check all indexes exist
SELECT 
  tablename, 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('questionnaire_responses', 'client_questionnaire_overrides')
ORDER BY tablename, indexname;

-- Expected: 7 indexes total
-- questionnaire_responses: 4 indexes + 1 primary key
-- client_questionnaire_overrides: 3 indexes + 1 primary key

-- 3. Check RLS is enabled
SELECT 
  schemaname,
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE tablename IN ('questionnaire_responses', 'client_questionnaire_overrides')
ORDER BY tablename;

-- Expected: Both tables should show rowsecurity = true

-- 4. Check RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('questionnaire_responses', 'client_questionnaire_overrides')
ORDER BY tablename, policyname;

-- Expected: 2 policies (one per table)

-- 5. Check constraints exist
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('questionnaire_responses', 'client_questionnaire_overrides')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Expected: Multiple constraints including CHECK, FOREIGN KEY, PRIMARY KEY, UNIQUE

-- 6. Test helper function: get_next_response_version
SELECT get_next_response_version('00000000-0000-0000-0000-000000000000'::uuid) as next_version;

-- Expected: Should return 1 for non-existent client

-- 7. Check triggers exist
SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('questionnaire_responses', 'client_questionnaire_overrides')
ORDER BY event_object_table, trigger_name;

-- Expected: 3 triggers total
-- questionnaire_responses: update_updated_at + set_latest_response
-- client_questionnaire_overrides: update_updated_at

-- 8. Check column data types
SELECT 
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('questionnaire_responses', 'client_questionnaire_overrides')
ORDER BY table_name, ordinal_position;

-- Expected: All columns with correct types

-- 9. Verify foreign key relationships
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('questionnaire_responses', 'client_questionnaire_overrides')
ORDER BY tc.table_name, kcu.column_name;

-- Expected: Foreign keys to clients, auth.users, questionnaire_questions, questionnaire_sections

-- 10. Test data insertion (optional - will rollback)
BEGIN;

-- Try inserting a test response (requires a real client_id from your database)
-- Replace with an actual client ID from your clients table
-- INSERT INTO questionnaire_responses (
--   client_id,
--   user_id,
--   version,
--   response_data,
--   status,
--   submitted_by
-- ) VALUES (
--   'YOUR-CLIENT-UUID-HERE'::uuid,
--   'YOUR-USER-UUID-HERE'::uuid,
--   1,
--   '{"test": "data"}'::jsonb,
--   'draft',
--   'admin'
-- );

-- Check if it worked
-- SELECT * FROM questionnaire_responses WHERE client_id = 'YOUR-CLIENT-UUID-HERE'::uuid;

ROLLBACK; -- Don't actually insert test data

-- ============================================
-- SUMMARY REPORT
-- ============================================
SELECT 
  '✅ MIGRATION VERIFICATION COMPLETE' as status,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name IN ('questionnaire_responses', 'client_questionnaire_overrides')) as tables_created,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE tablename IN ('questionnaire_responses', 'client_questionnaire_overrides')) as indexes_created,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE tablename IN ('questionnaire_responses', 'client_questionnaire_overrides')) as policies_created,
  (SELECT COUNT(*) FROM information_schema.triggers 
   WHERE event_object_table IN ('questionnaire_responses', 'client_questionnaire_overrides')) as triggers_created;

-- Expected output:
-- tables_created: 2
-- indexes_created: 7 (or more with primary keys)
-- policies_created: 2
-- triggers_created: 3

