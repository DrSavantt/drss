-- ============================================================================
-- CREATE RPC FUNCTION: remove_client_from_journal_mentions
-- ============================================================================
-- This function removes a client ID from the mentioned_clients array in all
-- journal entries that reference it. This is a BATCH operation that replaces
-- the N+1 query pattern where each journal entry was updated individually.
--
-- Performance improvement: 1 query instead of N queries (up to 100x faster)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.remove_client_from_journal_mentions(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use PostgreSQL's array_remove function to remove the client ID
  -- from the mentioned_clients array in all matching journal entries
  UPDATE journal_entries
  SET mentioned_clients = array_remove(mentioned_clients, p_client_id)
  WHERE mentioned_clients @> ARRAY[p_client_id]  -- Only update entries that contain this client
    AND deleted_at IS NULL;  -- Don't update already deleted entries
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.remove_client_from_journal_mentions(uuid) TO authenticated;

-- ============================================================================
-- USAGE EXAMPLE
-- ============================================================================
-- Before (N+1 pattern - slow):
-- SELECT id, mentioned_clients FROM journal_entries WHERE ...
-- FOR each entry:
--   UPDATE journal_entries SET mentioned_clients = array_remove(...) WHERE id = entry.id
-- Result: 1 + N queries
--
-- After (batch operation - fast):
-- SELECT remove_client_from_journal_mentions('client-uuid-here')
-- Result: 1 query
-- ============================================================================

-- Test the function (optional - comment out in production)
-- SELECT remove_client_from_journal_mentions('00000000-0000-0000-0000-000000000000');

