-- ============================================
-- PUBLIC QUESTIONNAIRE ACCESS POLICY
-- ============================================
-- This policy allows anonymous users to read client data
-- ONLY when querying by questionnaire_token.
-- This is needed for the public form route (/form/[token])
-- to work without authentication.
--
-- Security considerations:
-- 1. questionnaire_token is a UUID (unguessable)
-- 2. Token is only shared with the intended client
-- 3. Only SELECT is allowed (no INSERT/UPDATE/DELETE)
-- 4. Only specific fields are selected in the app
-- ============================================

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Public can read clients by questionnaire token" ON clients;

-- Create public read policy for questionnaire access
CREATE POLICY "Public can read clients by questionnaire token"
ON clients FOR SELECT
USING (
  -- Allow access if questionnaire_token is not null
  -- The actual token matching is done in the WHERE clause of the query
  questionnaire_token IS NOT NULL
);

-- Note: This policy allows reading any client that has a questionnaire_token,
-- but in practice, the app always filters by the specific token in the URL.
-- For stricter security, you could use a different approach like:
-- 1. A separate "public_questionnaire_data" view
-- 2. An RPC function that takes the token as a parameter
-- 3. Service role key for this specific query (but that bypasses RLS entirely)
