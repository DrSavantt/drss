-- Migration: Add content_asset_id to ai_executions
-- Purpose: Link AI executions to the content assets they create
-- This enables:
--   1. Tracking which AI execution created which content
--   2. Cascading client reassignment (when content moves, so does its AI history)

-- Add content_asset_id column to ai_executions
ALTER TABLE ai_executions 
ADD COLUMN IF NOT EXISTS content_asset_id UUID REFERENCES content_assets(id) ON DELETE SET NULL;

-- Create index for faster lookups by content_asset_id
CREATE INDEX IF NOT EXISTS idx_ai_executions_content_asset_id 
ON ai_executions(content_asset_id);

-- Add comment for documentation
COMMENT ON COLUMN ai_executions.content_asset_id IS 
'Links to the content_asset created by this AI execution (e.g., research reports). NULL if execution did not create content.';
