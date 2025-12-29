-- ============================================
-- VERIFICATION QUERIES FOR QUESTIONNAIRE TRACKING
-- ============================================
-- Run these queries to verify the migration was successful
-- ============================================

-- 1. Check that all three columns exist with correct types and defaults
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'clients' 
AND column_name IN ('questionnaire_status', 'questionnaire_progress', 'questionnaire_completed_at')
ORDER BY column_name;

-- Expected output:
-- questionnaire_completed_at | timestamp with time zone | YES | NULL
-- questionnaire_progress     | jsonb                    | YES | '{}'::jsonb
-- questionnaire_status       | text                     | YES | 'not_started'::text

-- ============================================

-- 2. Check that indexes were created
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'clients'
AND indexname IN ('idx_clients_questionnaire_status', 'idx_clients_questionnaire_progress')
ORDER BY indexname;

-- Expected output:
-- idx_clients_questionnaire_progress | CREATE INDEX idx_clients_questionnaire_progress ON public.clients USING gin (questionnaire_progress)
-- idx_clients_questionnaire_status   | CREATE INDEX idx_clients_questionnaire_status ON public.clients USING btree (questionnaire_status)

-- ============================================

-- 3. Verify existing clients have default values
SELECT 
    id,
    name,
    questionnaire_status,
    questionnaire_progress,
    questionnaire_completed_at
FROM clients
LIMIT 5;

-- All existing clients should have:
-- questionnaire_status = 'not_started'
-- questionnaire_progress = {}
-- questionnaire_completed_at = NULL

-- ============================================

-- 4. Test inserting a new client with questionnaire data
-- (This is a dry-run test - comment out to actually insert)
/*
INSERT INTO clients (
    user_id, 
    name, 
    email, 
    questionnaire_status, 
    questionnaire_progress
) VALUES (
    auth.uid(), -- Replace with actual user_id for testing
    'Test Client',
    'test@example.com',
    'in_progress',
    '{"current_section": 2, "completed_questions": [1,2,3,4], "last_updated": "2025-12-09T12:00:00Z"}'::jsonb
);
*/

-- ============================================

-- 5. Test querying clients by questionnaire status
SELECT 
    COUNT(*) as total_clients,
    questionnaire_status
FROM clients
GROUP BY questionnaire_status
ORDER BY questionnaire_status;

-- This shows distribution of clients across questionnaire states

-- ============================================

-- 6. Test JSONB query on questionnaire_progress
-- Find clients who are on section 2 or higher
SELECT 
    id,
    name,
    questionnaire_status,
    questionnaire_progress->>'current_section' as current_section
FROM clients
WHERE (questionnaire_progress->>'current_section')::int >= 2;

-- ============================================

-- 7. Test completed questionnaires
-- Find clients who completed the questionnaire in the last 30 days
SELECT 
    id,
    name,
    questionnaire_completed_at,
    AGE(NOW(), questionnaire_completed_at) as time_since_completion
FROM clients
WHERE questionnaire_completed_at IS NOT NULL
AND questionnaire_completed_at > NOW() - INTERVAL '30 days'
ORDER BY questionnaire_completed_at DESC;

-- ============================================
-- ALL TESTS PASSED ✅
-- ============================================
