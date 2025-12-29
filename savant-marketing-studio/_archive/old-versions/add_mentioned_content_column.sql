-- ============================================
-- ADD MENTIONED_CONTENT COLUMN TO JOURNAL_ENTRIES
-- ============================================
-- Allows @mentioning individual content pieces in journal entries

-- Add mentioned_content column (array of UUIDs)
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS mentioned_content UUID[] DEFAULT '{}';

-- Create index for faster queries on mentioned_content
CREATE INDEX IF NOT EXISTS idx_journal_entries_mentioned_content 
ON journal_entries USING GIN (mentioned_content);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'journal_entries' 
AND column_name = 'mentioned_content';
