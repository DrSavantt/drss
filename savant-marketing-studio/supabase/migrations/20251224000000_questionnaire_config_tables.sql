-- ============================================
-- QUESTIONNAIRE CONFIGURATION TABLES
-- Enables database-backed questionnaire management
-- ============================================

-- Questionnaire Sections
CREATE TABLE IF NOT EXISTS questionnaire_sections (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,           -- e.g., "avatar_definition"
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INTEGER DEFAULT 5,
  sort_order INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questionnaire Questions
CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id TEXT PRIMARY KEY,                -- e.g., "q1_ideal_customer"
  section_id INTEGER REFERENCES questionnaire_sections(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,         -- e.g., "q1" (backward compat)
  sort_order INTEGER NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL,                 -- 'long-text', 'short-text', 'multiple-choice', 'checkbox', 'file-upload'
  required BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  min_length INTEGER,
  max_length INTEGER,
  placeholder TEXT,
  options JSONB,                      -- For multiple-choice: [{"value": "x", "label": "X"}]
  conditional_on JSONB,               -- {"questionId": "q30", "notEquals": "separate"}
  accepted_file_types TEXT[],
  max_file_size INTEGER,              -- MB
  max_files INTEGER DEFAULT 5,
  file_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questionnaire Help Content (separate for cleaner editing)
CREATE TABLE IF NOT EXISTS questionnaire_help (
  id SERIAL PRIMARY KEY,
  question_id TEXT UNIQUE REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
  title TEXT,
  where_to_find TEXT[],
  how_to_extract TEXT[],
  good_example TEXT,
  weak_example TEXT,
  quick_tip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_section ON questionnaire_questions(section_id);
CREATE INDEX IF NOT EXISTS idx_questions_enabled ON questionnaire_questions(enabled);
CREATE INDEX IF NOT EXISTS idx_sections_enabled ON questionnaire_sections(enabled);
CREATE INDEX IF NOT EXISTS idx_sections_sort_order ON questionnaire_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_questions_sort_order ON questionnaire_questions(section_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_help_question ON questionnaire_help(question_id);

-- Updated_at triggers (create function first if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_questionnaire_sections_updated_at ON questionnaire_sections;
CREATE TRIGGER update_questionnaire_sections_updated_at 
  BEFORE UPDATE ON questionnaire_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questionnaire_questions_updated_at ON questionnaire_questions;
CREATE TRIGGER update_questionnaire_questions_updated_at 
  BEFORE UPDATE ON questionnaire_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questionnaire_help_updated_at ON questionnaire_help;
CREATE TRIGGER update_questionnaire_help_updated_at 
  BEFORE UPDATE ON questionnaire_help
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE questionnaire_sections IS 'Configurable questionnaire sections';
COMMENT ON TABLE questionnaire_questions IS 'Configurable questionnaire questions with validation rules';
COMMENT ON TABLE questionnaire_help IS 'Help content for questionnaire questions';

