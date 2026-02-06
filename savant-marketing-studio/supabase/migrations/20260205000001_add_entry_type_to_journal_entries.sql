-- Add entry_type column to journal_entries to distinguish captures from pages
-- Values: 'capture' (quick captures) or 'page' (full journal pages)

ALTER TABLE journal_entries 
ADD COLUMN entry_type TEXT DEFAULT 'page' CHECK (entry_type IN ('capture', 'page'));

-- Backfill: entries with icon '📝' are likely captures
UPDATE journal_entries 
SET entry_type = 'capture' 
WHERE icon = '📝';

-- Everything else stays as 'page' (the default)

-- Index for efficient filtering by entry_type
CREATE INDEX idx_journal_entries_type ON journal_entries(entry_type);
