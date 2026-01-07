-- Migration: Drop orphaned framework tables
-- Date: 2026-01-07
-- Author: Database Audit Tier 1.2
-- 
-- REASON: Database audit (Tier 1.1) found these tables are empty and unused.
-- 
-- AUDIT FINDINGS:
--   - `frameworks` table: 0 rows, NO code references
--   - `framework_embeddings` table: 0 rows, orphaned FK to `frameworks`
-- 
-- CANONICAL TABLES (NOT TOUCHED):
--   - `marketing_frameworks`: 1 row, actively used by 11 code references
--   - `framework_chunks`: 0 rows, correct FK to `marketing_frameworks`
-- 
-- The codebase exclusively uses `marketing_frameworks` for framework storage
-- and `framework_chunks` for RAG vector embeddings.

-- ============================================================================
-- STEP 1: Drop framework_embeddings first (has foreign key to frameworks)
-- ============================================================================
-- This table was created for the old `frameworks` table but was never populated.
-- The active RAG system uses `framework_chunks` which references `marketing_frameworks`.

DROP TABLE IF EXISTS framework_embeddings;

-- ============================================================================
-- STEP 2: Drop the orphaned frameworks table
-- ============================================================================
-- This table was an early implementation. The canonical table is `marketing_frameworks`.
-- Code search confirmed zero runtime references to this table.

DROP TABLE IF EXISTS frameworks;

-- ============================================================================
-- VERIFICATION (these should remain untouched)
-- ============================================================================
-- DO NOT DROP: marketing_frameworks (canonical, has data)
-- DO NOT DROP: framework_chunks (canonical embeddings table)

