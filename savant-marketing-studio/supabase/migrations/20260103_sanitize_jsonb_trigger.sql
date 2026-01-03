-- ============================================
-- MIGRATION: Sanitize JSONB Trigger
-- Purpose: Auto-convert {} to NULL on JSONB columns to prevent app crashes
-- Date: 2026-01-03
-- ============================================

-- ============================================
-- STEP 1: Create the sanitization trigger function
-- ============================================
CREATE OR REPLACE FUNCTION sanitize_client_jsonb()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert {} to NULL for questionnaire_progress
  IF NEW.questionnaire_progress IS NOT NULL AND 
     NEW.questionnaire_progress::text = '{}' THEN
    NEW.questionnaire_progress := NULL;
  END IF;
  
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

-- Add comment
COMMENT ON FUNCTION sanitize_client_jsonb() IS 'Automatically converts empty JSONB objects {} to NULL to prevent React rendering errors';

-- ============================================
-- STEP 2: Drop existing trigger if exists
-- ============================================
DROP TRIGGER IF EXISTS sanitize_clients_jsonb_trigger ON clients;

-- ============================================
-- STEP 3: Create the trigger on clients table
-- ============================================
CREATE TRIGGER sanitize_clients_jsonb_trigger
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION sanitize_client_jsonb();

-- Add comment
COMMENT ON TRIGGER sanitize_clients_jsonb_trigger ON clients IS 'Auto-sanitizes JSONB columns to prevent {} from being stored';

-- ============================================
-- STEP 4: Create trigger for questionnaire_responses table
-- ============================================
CREATE OR REPLACE FUNCTION sanitize_questionnaire_response_jsonb()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert {} to NULL for response_data
  IF NEW.response_data IS NOT NULL AND 
     NEW.response_data::text = '{}' THEN
    NEW.response_data := NULL;
  END IF;
  
  -- Convert {} to NULL for responses (legacy column if exists)
  IF NEW.responses IS NOT NULL AND 
     NEW.responses::text = '{}' THEN
    NEW.responses := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sanitize_questionnaire_response_jsonb() IS 'Automatically converts empty JSONB objects {} to NULL in questionnaire_responses';

DROP TRIGGER IF EXISTS sanitize_questionnaire_responses_jsonb_trigger ON questionnaire_responses;

CREATE TRIGGER sanitize_questionnaire_responses_jsonb_trigger
BEFORE INSERT OR UPDATE ON questionnaire_responses
FOR EACH ROW EXECUTE FUNCTION sanitize_questionnaire_response_jsonb();

COMMENT ON TRIGGER sanitize_questionnaire_responses_jsonb_trigger ON questionnaire_responses IS 'Auto-sanitizes JSONB columns to prevent {} from being stored';

-- ============================================
-- STEP 5: Clean up existing bad data in clients
-- ============================================
UPDATE clients 
SET 
  questionnaire_progress = NULLIF(questionnaire_progress::text, '{}')::jsonb,
  intake_responses = NULLIF(intake_responses::text, '{}')::jsonb,
  brand_data = NULLIF(brand_data::text, '{}')::jsonb
WHERE 
  questionnaire_progress::text = '{}'
  OR intake_responses::text = '{}'
  OR brand_data::text = '{}';

-- ============================================
-- STEP 6: Clean up existing bad data in questionnaire_responses
-- ============================================
UPDATE questionnaire_responses
SET 
  response_data = NULLIF(response_data::text, '{}')::jsonb,
  responses = NULLIF(responses::text, '{}')::jsonb
WHERE 
  response_data::text = '{}'
  OR responses::text = '{}';

-- ============================================
-- VERIFICATION: Show cleaned records
-- ============================================
DO $$
DECLARE
  clients_cleaned INTEGER;
  responses_cleaned INTEGER;
BEGIN
  SELECT COUNT(*) INTO clients_cleaned
  FROM clients
  WHERE questionnaire_progress IS NULL 
    AND intake_responses IS NULL 
    AND brand_data IS NULL;
  
  SELECT COUNT(*) INTO responses_cleaned
  FROM questionnaire_responses
  WHERE response_data IS NULL 
    OR responses IS NULL;
  
  RAISE NOTICE 'Migration complete. Triggers created and data sanitized.';
END $$;

