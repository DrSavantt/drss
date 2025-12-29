-- Chats/Streams (like Slack channels)
CREATE TABLE IF NOT EXISTS journal_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Inbox", "Client: Acme", "Project: Q4"
  type TEXT NOT NULL, -- "inbox", "client", "project", "general"
  linked_id UUID, -- client_id or project_id if linked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_chats_user_id ON journal_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_chats_type ON journal_chats(type);

-- Enable RLS
ALTER TABLE journal_chats ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can access their own chats" ON journal_chats;

-- Create RLS policy
CREATE POLICY "Users can access their own chats"
ON journal_chats FOR ALL
USING (auth.uid() = user_id);

-- Update journal_entries to link to chat and add voice_url
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES journal_chats(id) ON DELETE CASCADE;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS voice_url TEXT;

CREATE INDEX IF NOT EXISTS idx_journal_entries_chat_id ON journal_entries(chat_id);

-- Create default Inbox for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    INSERT INTO journal_chats (user_id, name, type)
    VALUES (user_record.id, 'Inbox', 'inbox')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Function to create default Inbox for new users (trigger)
CREATE OR REPLACE FUNCTION create_default_inbox()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO journal_chats (user_id, name, type)
  VALUES (NEW.id, 'Inbox', 'inbox');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create Inbox on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_inbox ON auth.users;
CREATE TRIGGER on_auth_user_created_inbox
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_inbox();

