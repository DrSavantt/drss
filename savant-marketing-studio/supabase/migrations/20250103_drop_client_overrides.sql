-- ============================================
-- MIGRATION: Drop unused client_questionnaire_overrides table
-- Date: January 3, 2026
-- Reason: Per-client customization feature never used, adding complexity
-- ============================================

-- ============================================
-- STEP 1: Backup first (optional, for safety)
-- ============================================
-- CREATE TABLE client_questionnaire_overrides_backup AS 
-- SELECT * FROM client_questionnaire_overrides;

-- ============================================
-- STEP 2: Drop the table (CASCADE to remove dependencies)
-- ============================================
DROP TABLE IF EXISTS client_questionnaire_overrides CASCADE;

-- ============================================
-- STEP 3: Verification
-- ============================================
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'client_questionnaire_overrides'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE EXCEPTION 'Migration failed: client_questionnaire_overrides table still exists';
  ELSE
    RAISE NOTICE 'Migration successful: client_questionnaire_overrides table dropped';
  END IF;
END $$;

