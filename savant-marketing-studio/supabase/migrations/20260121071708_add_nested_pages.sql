-- ============================================================================
-- Migration: Add Nested Page Support to journal_entries
-- 
-- This transforms journal_entries into a Notion-style nested page system.
-- Pages can contain other pages, creating a hierarchical structure.
-- ============================================================================

-- Add columns for nested page support
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS icon TEXT;  -- For emoji icons like Notion

-- Create index on parent_id first (needed for the backfill query performance)
CREATE INDEX IF NOT EXISTS idx_journal_entries_parent_id ON journal_entries(parent_id);

-- Backfill titles from content (first line or first 50 chars)
UPDATE journal_entries 
SET title = COALESCE(
  NULLIF(TRIM(SPLIT_PART(content, E'\n', 1)), ''),
  LEFT(TRIM(content), 50),
  'Untitled'
)
WHERE title IS NULL;

-- Set default for title column (for new entries)
ALTER TABLE journal_entries 
ALTER COLUMN title SET DEFAULT 'Untitled';

-- Additional index for sorting within parent
CREATE INDEX IF NOT EXISTS idx_journal_entries_parent_sort ON journal_entries(parent_id, sort_order);

-- Index for user + deleted queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_deleted ON journal_entries(user_id, deleted_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get page path (breadcrumbs) from page to root
CREATE OR REPLACE FUNCTION get_page_path(page_id UUID)
RETURNS TABLE(id UUID, title TEXT, depth INT) AS $$
WITH RECURSIVE page_path AS (
  -- Start with the target page
  SELECT 
    je.id, 
    je.title, 
    je.parent_id, 
    0 as depth
  FROM journal_entries je
  WHERE je.id = page_id AND je.deleted_at IS NULL
  
  UNION ALL
  
  -- Traverse up to parents
  SELECT 
    e.id, 
    e.title, 
    e.parent_id, 
    pp.depth + 1
  FROM journal_entries e
  INNER JOIN page_path pp ON e.id = pp.parent_id
  WHERE e.deleted_at IS NULL
)
SELECT pp.id, pp.title, pp.depth 
FROM page_path pp 
ORDER BY pp.depth DESC;  -- Root first, then down to target
$$ LANGUAGE SQL STABLE;

-- Function to get all descendants of a page (with depth limit to prevent runaway recursion)
CREATE OR REPLACE FUNCTION get_page_descendants(page_id UUID)
RETURNS TABLE(id UUID, title TEXT, parent_id UUID, depth INT) AS $$
WITH RECURSIVE descendants AS (
  -- Direct children of the page
  SELECT 
    je.id, 
    je.title, 
    je.parent_id,
    COALESCE(je.sort_order, 0) as sort_order,
    1 as depth
  FROM journal_entries je
  WHERE je.parent_id = page_id AND je.deleted_at IS NULL
  
  UNION ALL
  
  -- Recursively get children's children
  SELECT 
    e.id, 
    e.title, 
    e.parent_id,
    COALESCE(e.sort_order, 0) as sort_order,
    d.depth + 1
  FROM journal_entries e
  INNER JOIN descendants d ON e.parent_id = d.id
  WHERE e.deleted_at IS NULL AND d.depth < 10  -- Max 10 levels deep
)
SELECT d.id, d.title, d.parent_id, d.depth 
FROM descendants d 
ORDER BY d.depth, d.parent_id, d.sort_order;
$$ LANGUAGE SQL STABLE;

-- Function to check if a page is a descendant of another (for circular reference prevention)
CREATE OR REPLACE FUNCTION is_page_descendant(page_id UUID, potential_ancestor_id UUID)
RETURNS BOOLEAN AS $$
WITH RECURSIVE ancestors AS (
  -- Start with the page's parent
  SELECT parent_id 
  FROM journal_entries 
  WHERE id = page_id AND deleted_at IS NULL
  
  UNION ALL
  
  -- Traverse up the tree
  SELECT e.parent_id 
  FROM journal_entries e
  INNER JOIN ancestors a ON e.id = a.parent_id
  WHERE e.deleted_at IS NULL
)
SELECT EXISTS (
  SELECT 1 FROM ancestors WHERE parent_id = potential_ancestor_id
);
$$ LANGUAGE SQL STABLE;

-- Function to get the full page tree for sidebar rendering
CREATE OR REPLACE FUNCTION get_page_tree(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  icon TEXT,
  parent_id UUID,
  sort_order INTEGER,
  has_children BOOLEAN,
  child_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
SELECT 
  e.id,
  e.title,
  e.icon,
  e.parent_id,
  COALESCE(e.sort_order, 0) as sort_order,
  EXISTS(
    SELECT 1 FROM journal_entries c 
    WHERE c.parent_id = e.id AND c.deleted_at IS NULL
  ) as has_children,
  (
    SELECT COUNT(*) FROM journal_entries c 
    WHERE c.parent_id = e.id AND c.deleted_at IS NULL
  ) as child_count,
  e.created_at,
  e.updated_at
FROM journal_entries e
WHERE e.user_id = p_user_id AND e.deleted_at IS NULL
ORDER BY e.parent_id NULLS FIRST, COALESCE(e.sort_order, 0), e.created_at;
$$ LANGUAGE SQL STABLE;

-- Function to get root pages only (parent_id IS NULL)
CREATE OR REPLACE FUNCTION get_root_pages(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  icon TEXT,
  sort_order INTEGER,
  has_children BOOLEAN,
  child_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
SELECT 
  e.id,
  e.title,
  e.icon,
  COALESCE(e.sort_order, 0) as sort_order,
  EXISTS(
    SELECT 1 FROM journal_entries c 
    WHERE c.parent_id = e.id AND c.deleted_at IS NULL
  ) as has_children,
  (
    SELECT COUNT(*) FROM journal_entries c 
    WHERE c.parent_id = e.id AND c.deleted_at IS NULL
  ) as child_count,
  e.created_at,
  e.updated_at
FROM journal_entries e
WHERE e.user_id = p_user_id 
  AND e.parent_id IS NULL 
  AND e.deleted_at IS NULL
ORDER BY COALESCE(e.sort_order, 0), e.created_at;
$$ LANGUAGE SQL STABLE;

-- Function to get direct children of a page
CREATE OR REPLACE FUNCTION get_page_children(page_id UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  icon TEXT,
  sort_order INTEGER,
  has_children BOOLEAN,
  child_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
SELECT 
  e.id,
  e.title,
  e.icon,
  COALESCE(e.sort_order, 0) as sort_order,
  EXISTS(
    SELECT 1 FROM journal_entries c 
    WHERE c.parent_id = e.id AND c.deleted_at IS NULL
  ) as has_children,
  (
    SELECT COUNT(*) FROM journal_entries c 
    WHERE c.parent_id = e.id AND c.deleted_at IS NULL
  ) as child_count,
  e.created_at,
  e.updated_at
FROM journal_entries e
WHERE e.parent_id = page_id AND e.deleted_at IS NULL
ORDER BY COALESCE(e.sort_order, 0), e.created_at;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TRIGGER: Prevent Circular References
-- ============================================================================

-- Function to check for circular references before insert/update
CREATE OR REPLACE FUNCTION check_page_circular_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Check: page cannot be its own parent
  IF NEW.parent_id IS NOT NULL AND NEW.id = NEW.parent_id THEN
    RAISE EXCEPTION 'A page cannot be its own parent';
  END IF;
  
  -- Check: cannot move page into one of its descendants
  IF NEW.parent_id IS NOT NULL AND TG_OP = 'UPDATE' THEN
    IF is_page_descendant(NEW.parent_id, NEW.id) THEN
      RAISE EXCEPTION 'Circular reference detected: cannot move page into its own descendant';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS check_page_circular_reference_trigger ON journal_entries;

-- Create the trigger
CREATE TRIGGER check_page_circular_reference_trigger
BEFORE INSERT OR UPDATE ON journal_entries
FOR EACH ROW
WHEN (NEW.parent_id IS NOT NULL)
EXECUTE FUNCTION check_page_circular_reference();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN journal_entries.title IS 'Page title, displayed in sidebar and breadcrumbs';
COMMENT ON COLUMN journal_entries.parent_id IS 'Parent page ID for nesting. NULL = root page';
COMMENT ON COLUMN journal_entries.sort_order IS 'Sort order among siblings (0-based)';
COMMENT ON COLUMN journal_entries.icon IS 'Emoji or icon identifier for the page';

COMMENT ON FUNCTION get_page_path(UUID) IS 'Returns breadcrumb path from root to the given page';
COMMENT ON FUNCTION get_page_descendants(UUID) IS 'Returns all nested pages under the given page (max 10 levels)';
COMMENT ON FUNCTION is_page_descendant(UUID, UUID) IS 'Checks if first page is nested under second page (for circular ref prevention)';
COMMENT ON FUNCTION get_page_tree(UUID) IS 'Returns full page tree for sidebar, ordered for tree building';
COMMENT ON FUNCTION get_root_pages(UUID) IS 'Returns only root-level pages (no parent)';
COMMENT ON FUNCTION get_page_children(UUID) IS 'Returns direct children of a page';
