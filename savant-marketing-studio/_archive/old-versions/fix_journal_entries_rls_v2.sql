-- ============================================
-- FIX JOURNAL ENTRIES RLS - Version 2
-- ============================================
-- Updated to match actual table structure with user_id column

-- Drop existing policy
DROP POLICY IF EXISTS "Users can access entries for their chats" ON journal_entries;

-- Create new RLS policy based on user_id column
-- Users can only access their own journal entries
CREATE POLICY "Users can access their own journal entries"
ON journal_entries FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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
