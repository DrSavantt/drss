-- ============================================
-- ADD CASCADE DELETE CONSTRAINTS
-- ============================================
-- This migration adds proper foreign key constraints with ON DELETE CASCADE
-- for projects and content_assets to support cascade deletion when clients are deleted

-- Projects - CASCADE delete when client is deleted
-- Drop existing constraint if it exists
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_client_id_fkey;

-- Add new constraint with CASCADE
ALTER TABLE projects 
  ADD CONSTRAINT projects_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id) 
    ON DELETE CASCADE;

-- Content Assets - CASCADE delete when client is deleted
-- Drop existing constraint if it exists
ALTER TABLE content_assets 
  DROP CONSTRAINT IF EXISTS content_assets_client_id_fkey;

-- Add new constraint with CASCADE
ALTER TABLE content_assets 
  ADD CONSTRAINT content_assets_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES clients(id) 
    ON DELETE CASCADE;

-- Content Assets - CASCADE delete when project is deleted
-- Drop existing constraint if it exists
ALTER TABLE content_assets 
  DROP CONSTRAINT IF EXISTS content_assets_project_id_fkey;

-- Add new constraint with CASCADE
ALTER TABLE content_assets 
  ADD CONSTRAINT content_assets_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE CASCADE;

-- Note: journal_entries mentions are handled in the application layer
-- because mentioned_clients, mentioned_projects, and mentioned_content are UUID arrays
-- and we want to preserve entries by default (removing the mention, not the entry)

