-- ============================================
-- MIGRATION: Drop unused questionnaire_progress column
-- Date: January 3, 2026
-- Reason: Column was never written to, UI always showed zeros
-- ============================================

-- ============================================
-- STEP 1: Safety - Clear any existing data first
-- ============================================
UPDATE clients 
SET questionnaire_progress = NULL 
WHERE questionnaire_progress IS NOT NULL;

-- ============================================
-- STEP 2: Drop the column
-- ============================================
ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_progress;

-- ============================================
-- STEP 3: Verification
-- ============================================
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'questionnaire_progress'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'Migration failed: questionnaire_progress column still exists';
  ELSE
    RAISE NOTICE 'Migration successful: questionnaire_progress column dropped';
  END IF;
END $$;

