-- ============================================
-- FIX JOURNAL ENTRIES RLS PERMISSIONS
-- ============================================
-- Run this in Supabase SQL Editor to fix the permission error
-- This ensures journal_entries table exists with proper RLS policies

-- Create journal_entries table if it doesn't exist
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

-- Add missing columns if they don't exist (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'journal_entries' AND column_name = 'chat_id') THEN
    ALTER TABLE journal_entries ADD COLUMN chat_id UUID REFERENCES journal_chats(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'journal_entries' AND column_name = 'voice_url') THEN
    ALTER TABLE journal_entries ADD COLUMN voice_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'journal_entries' AND column_name = 'mentioned_clients') THEN
    ALTER TABLE journal_entries ADD COLUMN mentioned_clients UUID[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'journal_entries' AND column_name = 'tags') THEN
    ALTER TABLE journal_entries ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_journal_entries_chat_id ON journal_entries(chat_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Also ensure journal_chats has proper RLS with WITH CHECK
-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can access their own chats" ON journal_chats;

-- Recreate journal_chats policy with explicit WITH CHECK
CREATE POLICY "Users can access their own chats"
ON journal_chats FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can access entries for their chats" ON journal_entries;

-- Create RLS policy
-- Users can only access entries for chats they own
-- USING: for SELECT, UPDATE, DELETE operations
-- WITH CHECK: for INSERT, UPDATE operations
CREATE POLICY "Users can access entries for their chats"
ON journal_entries FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM journal_chats 
    WHERE journal_chats.id = journal_entries.chat_id 
    AND journal_chats.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM journal_chats 
    WHERE journal_chats.id = journal_entries.chat_id 
    AND journal_chats.user_id = auth.uid()
  )
);

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'journal_entries'
ORDER BY policyname;
