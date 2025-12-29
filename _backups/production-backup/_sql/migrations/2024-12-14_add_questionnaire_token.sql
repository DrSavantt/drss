-- Add questionnaire_token column for public form access
-- This allows clients to fill out questionnaires via shareable links without login

-- Add token column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS questionnaire_token TEXT UNIQUE;

-- Generate tokens for existing clients
UPDATE clients 
SET questionnaire_token = gen_random_uuid()::text 
WHERE questionnaire_token IS NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_clients_questionnaire_token 
ON clients(questionnaire_token);

-- Add comment for documentation
COMMENT ON COLUMN clients.questionnaire_token IS 'Unique token for public questionnaire form access';
