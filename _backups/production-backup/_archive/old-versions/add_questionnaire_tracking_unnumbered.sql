-- ============================================
-- ADD QUESTIONNAIRE TRACKING COLUMNS TO CLIENTS TABLE
-- ============================================
-- Extends the clients table to track questionnaire progress
-- for onboarding and brand data collection workflows.
--
-- Migration: add_questionnaire_tracking
-- Date: 2025-12-09
-- ============================================

-- ============================================
-- UP MIGRATION
-- ============================================

-- Add questionnaire_status column
-- Tracks overall questionnaire completion state
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS questionnaire_status TEXT DEFAULT 'not_started';

-- Add questionnaire_progress column
-- Stores detailed progress data as JSONB
-- Expected structure: { current_section: 1, completed_questions: [1,2,3], last_updated: "ISO timestamp" }
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS questionnaire_progress JSONB DEFAULT '{}';

-- Add questionnaire_completed_at column
-- Timestamp when questionnaire was fully submitted
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS questionnaire_completed_at TIMESTAMPTZ;

-- Add index on questionnaire_status for filtering clients by completion state
CREATE INDEX IF NOT EXISTS idx_clients_questionnaire_status 
ON clients(questionnaire_status);

-- Add GIN index on questionnaire_progress for JSONB queries
CREATE INDEX IF NOT EXISTS idx_clients_questionnaire_progress 
ON clients USING GIN (questionnaire_progress);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the columns were added successfully:
--
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'clients' 
-- AND column_name IN ('questionnaire_status', 'questionnaire_progress', 'questionnaire_completed_at')
-- ORDER BY column_name;

-- ============================================
-- DOWN MIGRATION (ROLLBACK)
-- ============================================
-- Uncomment and run these commands to rollback this migration:
--
-- DROP INDEX IF EXISTS idx_clients_questionnaire_status;
-- DROP INDEX IF EXISTS idx_clients_questionnaire_progress;
-- ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_status;
-- ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_progress;
-- ALTER TABLE clients DROP COLUMN IF EXISTS questionnaire_completed_at;
