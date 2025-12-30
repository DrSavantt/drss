-- Migration: Add AI cost tracking improvements
-- Description: Ensures cost_usd column exists with proper precision and adds performance indexes

-- Ensure total_cost_usd column exists with proper precision
-- Using DECIMAL(10, 6) to support costs up to $9,999.999999
DO $$ 
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ai_executions' 
    AND column_name = 'total_cost_usd'
  ) THEN
    ALTER TABLE ai_executions 
    ADD COLUMN total_cost_usd DECIMAL(10, 6) DEFAULT 0;
  END IF;
END $$;

-- Add indexes for common cost queries
CREATE INDEX IF NOT EXISTS idx_ai_executions_cost 
ON ai_executions(total_cost_usd) 
WHERE total_cost_usd > 0;

CREATE INDEX IF NOT EXISTS idx_ai_executions_user_created 
ON ai_executions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_executions_client_created 
ON ai_executions(client_id, created_at DESC) 
WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_executions_model_cost 
ON ai_executions(model_id, total_cost_usd);

-- Add comment to column
COMMENT ON COLUMN ai_executions.total_cost_usd IS 'Total cost in USD for this AI execution, calculated from input/output tokens and model pricing';

-- Create a view for easy cost reporting
CREATE OR REPLACE VIEW ai_cost_summary AS
SELECT 
  user_id,
  client_id,
  model_id,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as execution_count,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(input_tokens + output_tokens) as total_tokens,
  SUM(total_cost_usd) as total_cost_usd,
  AVG(duration_ms) as avg_duration_ms
FROM ai_executions
WHERE status = 'success'
GROUP BY user_id, client_id, model_id, DATE_TRUNC('day', created_at);

COMMENT ON VIEW ai_cost_summary IS 'Daily aggregated AI cost and usage summary per user, client, and model';

