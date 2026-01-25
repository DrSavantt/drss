-- Add tags and source columns to marketing_frameworks table
-- Tags: array of text for categorization (e.g., ['persuasion', 'email', 'sales'])
-- Source: attribution for where the framework originated

-- Add tags column (array of text)
ALTER TABLE marketing_frameworks
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add source column (attribution)
ALTER TABLE marketing_frameworks
ADD COLUMN IF NOT EXISTS source TEXT;

-- Add index on tags for array search (GIN index for efficient array containment queries)
CREATE INDEX IF NOT EXISTS idx_marketing_frameworks_tags
ON marketing_frameworks USING GIN (tags);

-- Comment on columns for documentation
COMMENT ON COLUMN marketing_frameworks.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN marketing_frameworks.source IS 'Attribution/source of the framework (e.g., author, book, website)';
