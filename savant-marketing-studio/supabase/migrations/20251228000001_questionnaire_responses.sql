-- ============================================
-- QUESTIONNAIRE RESPONSES (Version History)
-- Enables tracking of all questionnaire submissions with version history
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  response_data JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  is_latest BOOLEAN DEFAULT true,
  submitted_at TIMESTAMPTZ,
  submitted_by TEXT CHECK (submitted_by IN ('client', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_questionnaire_responses_client_id ON questionnaire_responses(client_id);
CREATE INDEX idx_questionnaire_responses_client_version ON questionnaire_responses(client_id, version DESC);
CREATE INDEX idx_questionnaire_responses_latest ON questionnaire_responses(client_id, is_latest) WHERE is_latest = true;
CREATE INDEX idx_questionnaire_responses_status ON questionnaire_responses(status);

-- Trigger to update updated_at
CREATE TRIGGER update_questionnaire_responses_updated_at 
  BEFORE UPDATE ON questionnaire_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CLIENT QUESTIONNAIRE OVERRIDES (Per-Client Customization)
-- Allows customizing questionnaire questions/sections per client
-- ============================================
CREATE TABLE IF NOT EXISTS client_questionnaire_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
  section_id INTEGER REFERENCES questionnaire_sections(id) ON DELETE CASCADE,
  override_type TEXT NOT NULL CHECK (override_type IN ('question', 'section', 'help')),
  is_enabled BOOLEAN DEFAULT true,
  custom_text TEXT,
  custom_help JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique override per client per question/section
  CONSTRAINT unique_client_question_override UNIQUE (client_id, question_id),
  CONSTRAINT unique_client_section_override UNIQUE (client_id, section_id, override_type),
  
  -- Ensure either question_id OR section_id is set, not both
  CONSTRAINT valid_override_target CHECK (
    (question_id IS NOT NULL AND section_id IS NULL) OR
    (question_id IS NULL AND section_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_client_overrides_client_id ON client_questionnaire_overrides(client_id);
CREATE INDEX idx_client_overrides_question ON client_questionnaire_overrides(question_id) WHERE question_id IS NOT NULL;
CREATE INDEX idx_client_overrides_section ON client_questionnaire_overrides(section_id) WHERE section_id IS NOT NULL;

-- Trigger to update updated_at
CREATE TRIGGER update_client_overrides_updated_at 
  BEFORE UPDATE ON client_questionnaire_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_questionnaire_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questionnaire_responses
CREATE POLICY "Users can access responses for their clients"
ON questionnaire_responses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = questionnaire_responses.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- RLS Policies for client_questionnaire_overrides
CREATE POLICY "Users can manage overrides for their clients"
ON client_questionnaire_overrides FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = client_questionnaire_overrides.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- ============================================
-- HELPER FUNCTION: Get Next Version Number
-- ============================================
CREATE OR REPLACE FUNCTION get_next_response_version(p_client_id UUID)
RETURNS INTEGER
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(MAX(version), 0) + 1
  FROM questionnaire_responses
  WHERE client_id = p_client_id;
$$;

-- ============================================
-- HELPER FUNCTION: Set Latest Flag
-- Automatically marks new response as latest and unmarks previous ones
-- ============================================
CREATE OR REPLACE FUNCTION set_response_as_latest()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set all other responses for this client to is_latest = false
  UPDATE questionnaire_responses
  SET is_latest = false
  WHERE client_id = NEW.client_id
    AND id != NEW.id
    AND is_latest = true;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-update is_latest on insert
CREATE TRIGGER set_latest_response
  AFTER INSERT ON questionnaire_responses
  FOR EACH ROW
  WHEN (NEW.is_latest = true)
  EXECUTE FUNCTION set_response_as_latest();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE questionnaire_responses IS 'Stores all questionnaire submissions with version history';
COMMENT ON TABLE client_questionnaire_overrides IS 'Per-client customizations of questionnaire questions and sections';
COMMENT ON COLUMN questionnaire_responses.version IS 'Auto-incremented version number per client';
COMMENT ON COLUMN questionnaire_responses.is_latest IS 'Only one response per client should have is_latest = true';
COMMENT ON COLUMN questionnaire_responses.submitted_by IS 'Tracks whether client or admin submitted the response';
COMMENT ON COLUMN client_questionnaire_overrides.override_type IS 'Type of override: question (change question), section (enable/disable), help (custom help content)';

