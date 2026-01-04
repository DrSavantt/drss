-- ============================================
-- MIGRATION: Move help content into questions table
-- Purpose: Simplify help system by embedding help_content JSONB directly in questions
-- Date: 2026-01-04
-- ============================================

-- ============================================
-- STEP 1: Add help_content JSONB column to questionnaire_questions
-- ============================================
ALTER TABLE questionnaire_questions 
ADD COLUMN IF NOT EXISTS help_content JSONB;

COMMENT ON COLUMN questionnaire_questions.help_content IS 'Embedded help content (title, where_to_find, how_to_extract, good_example, weak_example, quick_tip)';

-- ============================================
-- STEP 2: Migrate existing help data into questions
-- ============================================
UPDATE questionnaire_questions q
SET help_content = jsonb_build_object(
  'title', h.title,
  'where_to_find', h.where_to_find,
  'how_to_extract', h.how_to_extract,
  'good_example', h.good_example,
  'weak_example', h.weak_example,
  'quick_tip', h.quick_tip
)
FROM questionnaire_help h
WHERE h.question_id = q.id;

-- ============================================
-- STEP 3: Verify migration worked
-- ============================================
DO $$
DECLARE
  migrated_count INTEGER;
  help_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM questionnaire_questions
  WHERE help_content IS NOT NULL;
  
  SELECT COUNT(*) INTO help_count
  FROM questionnaire_help;
  
  RAISE NOTICE 'Migration complete: % questions now have help_content (% original help records)', migrated_count, help_count;
END $$;

