-- ============================================
-- MIGRATION: Drop questionnaire_help table
-- Purpose: Clean up after migrating help content to questions.help_content
-- Date: 2026-01-04
-- IMPORTANT: Only run this AFTER verifying the help_content migration worked!
-- ============================================

-- ============================================
-- STEP 1: Verify migration was successful
-- ============================================
DO $$
DECLARE
  questions_with_help INTEGER;
  orphaned_help INTEGER;
BEGIN
  -- Check how many questions have help_content
  SELECT COUNT(*) INTO questions_with_help
  FROM questionnaire_questions
  WHERE help_content IS NOT NULL;
  
  -- Check for any help records that weren't migrated
  SELECT COUNT(*) INTO orphaned_help
  FROM questionnaire_help h
  WHERE NOT EXISTS (
    SELECT 1 FROM questionnaire_questions q 
    WHERE q.id = h.question_id AND q.help_content IS NOT NULL
  );
  
  RAISE NOTICE 'Questions with help_content: %', questions_with_help;
  RAISE NOTICE 'Orphaned help records (not migrated): %', orphaned_help;
  
  IF orphaned_help > 0 THEN
    RAISE WARNING 'There are % help records that were not migrated! Review before dropping table.', orphaned_help;
  END IF;
END $$;

-- ============================================
-- STEP 2: Drop RLS policies on questionnaire_help
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated read access to help" ON questionnaire_help;
DROP POLICY IF EXISTS "questionnaire_help_read_policy" ON questionnaire_help;

-- ============================================
-- STEP 3: Drop the questionnaire_help table
-- ============================================
DROP TABLE IF EXISTS questionnaire_help CASCADE;

-- ============================================
-- STEP 4: Confirm table dropped
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'questionnaire_help'
  ) THEN
    RAISE NOTICE 'questionnaire_help table successfully dropped!';
  ELSE
    RAISE EXCEPTION 'Failed to drop questionnaire_help table';
  END IF;
END $$;

