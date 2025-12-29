-- ============================================
-- ADD INDUSTRY COLUMN TO CLIENTS TABLE
-- ============================================
-- This migration adds the industry column that the 
-- new-client-dialog form expects to save.

-- Add the industry column if it doesn't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS industry TEXT;

-- Add index for filtering by industry
CREATE INDEX IF NOT EXISTS idx_clients_industry 
ON clients(industry);

-- Add comment for documentation
COMMENT ON COLUMN clients.industry IS 'Business industry category (e.g., SaaS, E-commerce, Finance)';

