-- ============================================
-- JOURNAL ENTRIES TABLE
-- ============================================
-- This table stores individual journal entries
-- Each entry belongs to a journal_chat

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES journal_chats(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mentioned_clients UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  voice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_chat_id ON journal_entries(chat_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can access entries for their chats" ON journal_entries;

-- Create RLS policy
-- Users can only access entries for chats they own
CREATE POLICY "Users can access entries for their chats"
ON journal_entries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM journal_chats 
    WHERE journal_chats.id = journal_entries.chat_id 
    AND journal_chats.user_id = auth.uid()
  )
);
