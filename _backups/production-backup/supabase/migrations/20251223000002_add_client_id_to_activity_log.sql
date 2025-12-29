-- ============================================
-- ADD CLIENT_ID TO ACTIVITY_LOG TABLE
-- ============================================
-- This allows us to easily filter activities by client
-- without complex joins

-- Add the client_id column (nullable since some activities might not relate to a client)
ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_activity_log_client_id ON activity_log(client_id);

-- Backfill client_id for existing activities (only where client still exists)
-- For client activities: entity_id IS the client_id (only if client exists)
UPDATE activity_log 
SET client_id = entity_id 
WHERE entity_type = 'client' 
  AND client_id IS NULL
  AND EXISTS (SELECT 1 FROM clients WHERE clients.id = activity_log.entity_id);

-- For project activities: look up client_id from projects table (only if project and client exist)
UPDATE activity_log 
SET client_id = (
  SELECT client_id FROM projects WHERE projects.id = activity_log.entity_id
)
WHERE entity_type = 'project' 
  AND client_id IS NULL
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = activity_log.entity_id
  );

-- For content activities: look up client_id from content_assets table (only if content and client exist)
UPDATE activity_log 
SET client_id = (
  SELECT client_id FROM content_assets WHERE content_assets.id = activity_log.entity_id
)
WHERE entity_type = 'content' 
  AND client_id IS NULL
  AND EXISTS (
    SELECT 1 FROM content_assets 
    WHERE content_assets.id = activity_log.entity_id
  );

-- Add comment for documentation
COMMENT ON COLUMN activity_log.client_id IS 'Client this activity relates to (for filtering)';

