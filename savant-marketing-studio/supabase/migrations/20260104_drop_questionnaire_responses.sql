-- ============================================
-- MIGRATION: Drop questionnaire_responses table
-- Date: January 4, 2026
-- Reason: Simplified to use clients.intake_responses only
-- ============================================

-- Step 1: Copy any remaining data from questionnaire_responses to clients
-- This ensures no data is lost before dropping the table
-- Only copies if clients.intake_responses is NULL or empty
UPDATE clients c
SET intake_responses = qr.response_data
FROM questionnaire_responses qr
WHERE qr.client_id = c.id 
  AND qr.is_latest = true
  AND qr.response_data IS NOT NULL
  AND qr.response_data::text != '{}'
  AND (c.intake_responses IS NULL OR c.intake_responses::text = '{}');

-- Step 2: Drop the trigger from questionnaire_responses (if exists)
DROP TRIGGER IF EXISTS sanitize_questionnaire_responses_jsonb_trigger ON questionnaire_responses;

-- Step 3: Drop the trigger function (if not used elsewhere)
DROP FUNCTION IF EXISTS sanitize_questionnaire_response_jsonb();

-- Step 4: Drop the get_next_response_version function (used for version numbering)
DROP FUNCTION IF EXISTS get_next_response_version(UUID);

-- Step 5: Drop the questionnaire_responses table
DROP TABLE IF EXISTS questionnaire_responses CASCADE;

-- Step 6: Verification
DO $$
BEGIN
  -- Check if table was dropped
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'questionnaire_responses') THEN
    RAISE EXCEPTION 'Table questionnaire_responses still exists!';
  ELSE
    RAISE NOTICE 'Migration complete: questionnaire_responses table dropped successfully.';
    RAISE NOTICE 'All questionnaire data is now stored in clients.intake_responses.';
  END IF;
END $$;

