-- ============================================
-- TIER 5.1: AI CONVERSATIONS SCHEMA
-- Created: 2026-01-10
-- Purpose: Add conversation grouping to AI chat feature
-- ============================================

-- ============================================
-- 1. AI CONVERSATIONS TABLE
-- Groups AI messages into conversations with metadata
-- ============================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Conversation metadata
  title TEXT NOT NULL DEFAULT 'New Chat',
  framework_ids UUID[] DEFAULT '{}',      -- Array of framework IDs loaded for context
  system_prompt TEXT,                      -- Cached system prompt with client context
  
  -- Aggregated usage stats (updated by trigger/function)
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,6) DEFAULT 0,
  
  -- Quality tracking
  quality_rating SMALLINT CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 10)),
  
  -- Lifecycle management
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE ai_conversations IS 'Groups AI chat messages into conversations with client context and usage tracking';
COMMENT ON COLUMN ai_conversations.framework_ids IS 'Array of marketing_frameworks IDs loaded as context for this conversation';
COMMENT ON COLUMN ai_conversations.system_prompt IS 'Cached system prompt containing client context, regenerated when client data changes';
COMMENT ON COLUMN ai_conversations.quality_rating IS 'User rating 1-10 for conversation quality, used for model improvement';
COMMENT ON COLUMN ai_conversations.status IS 'active = visible in chat list, archived = hidden but retained';

-- ============================================
-- 2. INDEXES FOR AI CONVERSATIONS
-- Optimize common query patterns
-- ============================================

-- User's conversation list (most recent first)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id 
ON ai_conversations(user_id);

-- Filter by client
CREATE INDEX IF NOT EXISTS idx_ai_conversations_client_id 
ON ai_conversations(client_id) 
WHERE client_id IS NOT NULL;

-- Sort by recency
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at 
ON ai_conversations(created_at DESC);

-- Active conversations query (most common)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_active 
ON ai_conversations(user_id, created_at DESC) 
WHERE status = 'active';

-- ============================================
-- 3. RLS POLICIES FOR AI CONVERSATIONS
-- Users can only access their own conversations
-- ============================================
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Single policy for all operations (simpler and more efficient)
DROP POLICY IF EXISTS "Users can manage their own conversations" ON ai_conversations;
CREATE POLICY "Users can manage their own conversations"
ON ai_conversations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. ALTER AI_EXECUTIONS TABLE
-- Add columns to link executions to conversations
-- ============================================

-- Add conversation_id to group messages into conversations
ALTER TABLE ai_executions 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE;

COMMENT ON COLUMN ai_executions.conversation_id IS 'Links this execution to a conversation for chat history';

-- Add project_id for saving AI outputs to projects
ALTER TABLE ai_executions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

COMMENT ON COLUMN ai_executions.project_id IS 'Optional link to save AI output to a project';

-- Add message_role for chat display (user question vs assistant response)
ALTER TABLE ai_executions
ADD COLUMN IF NOT EXISTS message_role TEXT CHECK (message_role IS NULL OR message_role IN ('user', 'assistant', 'system'));

COMMENT ON COLUMN ai_executions.message_role IS 'Role in conversation: user (question), assistant (response), system (context)';

-- Index for fetching conversation messages
CREATE INDEX IF NOT EXISTS idx_ai_executions_conversation_id 
ON ai_executions(conversation_id) 
WHERE conversation_id IS NOT NULL;

-- Index for project-linked executions
CREATE INDEX IF NOT EXISTS idx_ai_executions_project_id 
ON ai_executions(project_id) 
WHERE project_id IS NOT NULL;

-- ============================================
-- 5. UPDATED_AT TRIGGER FOR AI CONVERSATIONS
-- Automatically update timestamp on any modification
-- ============================================

-- Create the trigger function (reusable pattern)
CREATE OR REPLACE FUNCTION update_ai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_ai_conversations_updated_at() IS 'Trigger function to auto-update updated_at timestamp';

-- Create the trigger
DROP TRIGGER IF EXISTS ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversations_updated_at();

-- ============================================
-- 6. FUNCTION TO UPDATE CONVERSATION TOTALS
-- Called after each message to aggregate stats
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_totals(conv_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ai_conversations
  SET 
    total_input_tokens = COALESCE((
      SELECT SUM(input_tokens) 
      FROM ai_executions 
      WHERE conversation_id = conv_id
    ), 0),
    total_output_tokens = COALESCE((
      SELECT SUM(output_tokens) 
      FROM ai_executions 
      WHERE conversation_id = conv_id
    ), 0),
    total_cost_usd = COALESCE((
      SELECT SUM(total_cost_usd) 
      FROM ai_executions 
      WHERE conversation_id = conv_id
    ), 0),
    updated_at = NOW()
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_conversation_totals(UUID) IS 'Aggregates token counts and costs from all executions in a conversation';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_conversation_totals(UUID) TO authenticated;

-- ============================================
-- 7. OPTIONAL: AUTO-UPDATE TOTALS TRIGGER
-- Automatically updates conversation totals when executions change
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_conversation_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT or UPDATE, update the new conversation
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.conversation_id IS NOT NULL THEN
      PERFORM update_conversation_totals(NEW.conversation_id);
    END IF;
  END IF;
  
  -- On UPDATE or DELETE, update the old conversation if it changed
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.conversation_id IS NOT NULL AND 
       (TG_OP = 'DELETE' OR OLD.conversation_id != NEW.conversation_id) THEN
      PERFORM update_conversation_totals(OLD.conversation_id);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_update_conversation_totals() IS 'Trigger function to auto-update conversation totals when executions change';

-- Create trigger on ai_executions
DROP TRIGGER IF EXISTS ai_executions_update_conversation_totals ON ai_executions;
CREATE TRIGGER ai_executions_update_conversation_totals
  AFTER INSERT OR UPDATE OR DELETE ON ai_executions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_conversation_totals();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Test queries:
-- 
-- 1. Create a conversation:
--    INSERT INTO ai_conversations (user_id, client_id, title) 
--    VALUES (auth.uid(), 'client-uuid', 'Brand Strategy Chat');
--
-- 2. Add an execution to conversation:
--    INSERT INTO ai_executions (user_id, model_id, task_type, conversation_id, message_role, input_tokens, output_tokens, status)
--    VALUES (auth.uid(), 'model-uuid', 'chat', 'conv-uuid', 'assistant', 100, 500, 'success');
--
-- 3. Verify totals updated:
--    SELECT total_input_tokens, total_output_tokens FROM ai_conversations WHERE id = 'conv-uuid';
-- ============================================
