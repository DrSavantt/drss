-- Journal folders table for organizing chats and notes
CREATE TABLE IF NOT EXISTS journal_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#EF4444', -- red-primary
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add folder_id to journal_chats
ALTER TABLE journal_chats 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES journal_folders(id) ON DELETE SET NULL;

-- Add updated_at to journal_chats if not exists
ALTER TABLE journal_chats
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- RLS policies for journal_folders
ALTER TABLE journal_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own folders" ON journal_folders;
CREATE POLICY "Users can manage their own folders"
ON journal_folders FOR ALL
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journal_folders_user_id ON journal_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_chats_folder_id ON journal_chats(folder_id);
CREATE INDEX IF NOT EXISTS idx_journal_chats_updated_at ON journal_chats(updated_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journal_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on journal_chats
DROP TRIGGER IF EXISTS journal_chats_updated_at ON journal_chats;
CREATE TRIGGER journal_chats_updated_at
  BEFORE UPDATE ON journal_chats
  FOR EACH ROW EXECUTE FUNCTION update_journal_chat_updated_at();

-- Update existing rows to have updated_at
UPDATE journal_chats SET updated_at = created_at WHERE updated_at IS NULL;

