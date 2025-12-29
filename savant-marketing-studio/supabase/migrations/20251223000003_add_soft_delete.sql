-- Add soft delete columns to clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Add soft delete columns to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add soft delete columns to content_assets
ALTER TABLE content_assets 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add soft delete to journal_entries
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add soft delete to journal_chats
ALTER TABLE journal_chats
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for faster queries on non-deleted items
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_content_assets_deleted_at ON content_assets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_deleted_at ON journal_entries(deleted_at);
CREATE INDEX IF NOT EXISTS idx_journal_chats_deleted_at ON journal_chats(deleted_at);

