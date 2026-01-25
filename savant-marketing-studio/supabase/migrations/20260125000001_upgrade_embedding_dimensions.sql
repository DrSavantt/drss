-- ============================================================================
-- Migration: Upgrade embedding dimensions from 1536 to 2000
-- Purpose: Switch from OpenAI (1536 dims) to Gemini (2000 dims) embeddings
-- Note: Supabase pgvector has 2000 dim index limit, so using max supported
-- Date: 2026-01-25
-- ============================================================================

-- First, drop the existing function (it references the old dimension)
DROP FUNCTION IF EXISTS match_framework_chunks(vector, float, int);
DROP FUNCTION IF EXISTS match_framework_chunks(vector, double precision, integer);

-- Drop the existing index
DROP INDEX IF EXISTS idx_framework_chunks_embedding;

-- Clear existing embeddings (they're incompatible with new dimension size)
TRUNCATE TABLE framework_chunks;

-- Alter the embedding column to new dimension size
ALTER TABLE framework_chunks 
ALTER COLUMN embedding TYPE vector(2000);

-- Recreate index using HNSW (better performance than ivfflat)
CREATE INDEX idx_framework_chunks_embedding 
ON framework_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Recreate the match_framework_chunks function with new dimensions
CREATE OR REPLACE FUNCTION match_framework_chunks(
  query_embedding vector(2000),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  framework_id uuid,
  content text,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    framework_chunks.id,
    framework_chunks.framework_id,
    framework_chunks.content,
    1 - (framework_chunks.embedding <=> query_embedding) AS similarity
  FROM framework_chunks
  WHERE 1 - (framework_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY framework_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Add comments documenting the change
COMMENT ON FUNCTION match_framework_chunks(vector, float, int) IS 
  'Semantic search for framework chunks using Gemini gemini-embedding-001 (2000 dimensions)';

COMMENT ON COLUMN framework_chunks.embedding IS 
  'Vector embedding from Gemini gemini-embedding-001 model (2000 dimensions)';

-- ============================================================================
-- Verification query (run manually after migration):
-- 
-- SELECT array_length(embedding, 1) FROM framework_chunks LIMIT 1;
-- -- Should return 2000
-- ============================================================================
