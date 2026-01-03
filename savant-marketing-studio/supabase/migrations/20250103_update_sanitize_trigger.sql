-- ============================================
-- MIGRATION: Update sanitize trigger to remove questionnaire_progress reference
-- Date: January 3, 2026
-- Reason: questionnaire_progress column has been dropped
-- ============================================

-- ============================================
-- STEP 1: Update the sanitization trigger function
-- ============================================
CREATE OR REPLACE FUNCTION sanitize_client_jsonb()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert {} to NULL for intake_responses
  IF NEW.intake_responses IS NOT NULL AND 
     NEW.intake_responses::text = '{}' THEN
    NEW.intake_responses := NULL;
  END IF;
  
  -- Convert {} to NULL for brand_data
  IF NEW.brand_data IS NOT NULL AND 
     NEW.brand_data::text = '{}' THEN
    NEW.brand_data := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update comment
COMMENT ON FUNCTION sanitize_client_jsonb() IS 'Automatically converts empty JSONB objects {} to NULL to prevent React rendering errors. Updated 2026-01-03: Removed questionnaire_progress reference (column dropped).';

-- ============================================
-- STEP 2: Trigger remains the same (no need to recreate)
-- ============================================
-- The existing trigger sanitize_clients_jsonb_trigger will use the updated function

-- ============================================
-- STEP 3: Verification
-- ============================================
DO $$
DECLARE
  function_source TEXT;
BEGIN
  SELECT pg_get_functiondef(oid) INTO function_source
  FROM pg_proc
  WHERE proname = 'sanitize_client_jsonb';
  
  IF function_source LIKE '%questionnaire_progress%' THEN
    RAISE WARNING 'Function still contains questionnaire_progress reference - please review';
  ELSE
    RAISE NOTICE 'Migration successful: sanitize_client_jsonb() updated, questionnaire_progress reference removed';
  END IF;
END $$;

