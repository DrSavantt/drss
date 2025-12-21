-- ============================================
-- RPC FUNCTION: count_journal_entries
-- ============================================
-- Returns the total count of journal entries for the authenticated user
-- Counts all entries across all chats owned by the user

CREATE OR REPLACE FUNCTION count_journal_entries()
RETURNS INTEGER AS $$
DECLARE
  entry_count INTEGER;
BEGIN
  -- Count journal entries for all chats owned by the current user
  SELECT COUNT(*) INTO entry_count
  FROM journal_entries je
  INNER JOIN journal_chats jc ON je.chat_id = jc.id
  WHERE jc.user_id = auth.uid();
  
  RETURN COALESCE(entry_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION count_journal_entries() TO authenticated;

-- Test the function (optional - comment out in production)
-- SELECT count_journal_entries();

