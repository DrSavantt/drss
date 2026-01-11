-- Migration: Add type column to marketing_frameworks
-- Purpose: Distinguish between Content Types (WHAT format) and Writing Frameworks (HOW to structure)
-- 
-- Content Types: Define the format being created (Facebook Ad, Email, Landing Page, Blog Post)
--                Contains format constraints, character limits, required sections
--
-- Writing Frameworks: Define how to structure the persuasion (AIDA, PAS, BAB, StoryBrand)
--                     Contains persuasion flow, psychological structure
--
-- Usage: "Facebook Ad written in AIDA style" = content-type + writing-framework

-- Add type column with CHECK constraint
-- Default to 'writing-framework' for existing data (since current entries like AIDA are frameworks)
ALTER TABLE marketing_frameworks 
ADD COLUMN type TEXT NOT NULL DEFAULT 'writing-framework'
CHECK (type IN ('content-type', 'writing-framework'));

-- Add comment explaining the column
COMMENT ON COLUMN marketing_frameworks.type IS 
  'Framework type: content-type (format definition like Facebook Ad) or writing-framework (persuasion structure like AIDA)';

-- Add index for efficient filtering by type
CREATE INDEX idx_marketing_frameworks_type ON marketing_frameworks(type);

-- Ensure existing AIDA framework is correctly typed as writing-framework
-- (This is a no-op since default is writing-framework, but explicit for clarity)
UPDATE marketing_frameworks 
SET type = 'writing-framework' 
WHERE name LIKE '%AIDA%';
