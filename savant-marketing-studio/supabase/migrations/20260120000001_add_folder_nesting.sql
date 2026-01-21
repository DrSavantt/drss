-- ============================================================================
-- Migration: Add Nested Folder Support to journal_folders
-- Date: 2026-01-20
-- Description: Adds parent_id column and helper functions for folder hierarchy
-- ============================================================================

-- Add parent_id for nested folder support
-- ON DELETE CASCADE ensures children are deleted when parent is deleted
ALTER TABLE journal_folders 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES journal_folders(id) ON DELETE CASCADE;

-- Index for efficient tree queries (finding children of a parent)
CREATE INDEX IF NOT EXISTS idx_journal_folders_parent_id 
ON journal_folders(parent_id);

-- Composite index for ordering children within a parent
CREATE INDEX IF NOT EXISTS idx_journal_folders_parent_position 
ON journal_folders(parent_id, "position");

-- ============================================================================
-- Function: get_folder_path
-- Returns the path from root to the specified folder (for breadcrumbs)
-- Usage: SELECT * FROM get_folder_path('folder-uuid');
-- ============================================================================
CREATE OR REPLACE FUNCTION get_folder_path(folder_id UUID)
RETURNS TABLE(id UUID, name TEXT, depth INT) AS $$
WITH RECURSIVE folder_path AS (
  -- Start with the target folder
  SELECT 
    f.id, 
    f.name, 
    f.parent_id, 
    0 as depth
  FROM journal_folders f
  WHERE f.id = folder_id
  
  UNION ALL
  
  -- Walk up the tree to parents
  SELECT 
    f.id, 
    f.name, 
    f.parent_id, 
    fp.depth + 1
  FROM journal_folders f
  INNER JOIN folder_path fp ON f.id = fp.parent_id
  WHERE fp.depth < 20  -- Safety limit to prevent infinite loops
)
SELECT 
  folder_path.id, 
  folder_path.name, 
  folder_path.depth 
FROM folder_path 
ORDER BY depth DESC;  -- Root first, target last
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Function: get_folder_descendants
-- Returns all descendants of a folder (children, grandchildren, etc.)
-- Usage: SELECT * FROM get_folder_descendants('folder-uuid');
-- ============================================================================
CREATE OR REPLACE FUNCTION get_folder_descendants(folder_id UUID)
RETURNS TABLE(id UUID, name TEXT, parent_id UUID, depth INT) AS $$
WITH RECURSIVE descendants AS (
  -- Start with direct children
  SELECT 
    f.id, 
    f.name, 
    f.parent_id, 
    1 as depth
  FROM journal_folders f
  WHERE f.parent_id = folder_id
  
  UNION ALL
  
  -- Recursively get children of children
  SELECT 
    f.id, 
    f.name, 
    f.parent_id, 
    d.depth + 1
  FROM journal_folders f
  INNER JOIN descendants d ON f.parent_id = d.id
  WHERE d.depth < 10  -- Max depth limit to prevent infinite loops
)
SELECT * FROM descendants ORDER BY depth, name;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Function: is_folder_descendant
-- Checks if a folder is a descendant of another (for circular ref validation)
-- Returns TRUE if potential_descendant is a descendant of potential_ancestor
-- Usage: SELECT is_folder_descendant('child-uuid', 'ancestor-uuid');
-- ============================================================================
CREATE OR REPLACE FUNCTION is_folder_descendant(
  potential_descendant UUID, 
  potential_ancestor UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- A folder cannot be its own descendant
  IF potential_descendant = potential_ancestor THEN
    RETURN TRUE;
  END IF;
  
  -- Check if potential_descendant appears in the descendants of potential_ancestor
  RETURN EXISTS (
    SELECT 1 
    FROM get_folder_descendants(potential_ancestor) d
    WHERE d.id = potential_descendant
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Function: get_folder_tree
-- Returns all folders for a user in a format ready for tree building
-- Usage: SELECT * FROM get_folder_tree('user-uuid');
-- ============================================================================
CREATE OR REPLACE FUNCTION get_folder_tree(p_user_id UUID)
RETURNS TABLE(
  id UUID, 
  name TEXT, 
  color TEXT,
  sort_position INT,
  parent_id UUID, 
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  chat_count BIGINT
) AS $$
SELECT 
  f.id,
  f.name,
  f.color,
  f."position" as sort_position,
  f.parent_id,
  f.created_at,
  f.updated_at,
  COALESCE(
    (SELECT COUNT(*) 
     FROM journal_chats c 
     WHERE c.folder_id = f.id 
     AND c.deleted_at IS NULL
     AND c.user_id = p_user_id
    ), 0
  ) as chat_count
FROM journal_folders f
WHERE f.user_id = p_user_id
ORDER BY f.parent_id NULLS FIRST, f."position", f.name;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Trigger: Prevent circular references on insert/update
-- ============================================================================
CREATE OR REPLACE FUNCTION check_folder_circular_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL parent_id (root folders)
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Prevent setting parent to self
  IF NEW.id = NEW.parent_id THEN
    RAISE EXCEPTION 'A folder cannot be its own parent';
  END IF;
  
  -- Prevent circular reference (parent can't be a descendant)
  IF is_folder_descendant(NEW.parent_id, NEW.id) THEN
    RAISE EXCEPTION 'Cannot move folder: would create circular reference';
  END IF;
  
  -- Ensure parent belongs to same user
  IF NOT EXISTS (
    SELECT 1 FROM journal_folders 
    WHERE id = NEW.parent_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Parent folder not found or belongs to different user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS check_folder_circular_reference_trigger ON journal_folders;

CREATE TRIGGER check_folder_circular_reference_trigger
BEFORE INSERT OR UPDATE ON journal_folders
FOR EACH ROW
WHEN (NEW.parent_id IS NOT NULL)
EXECUTE FUNCTION check_folder_circular_reference();

-- ============================================================================
-- Update existing folders: ensure parent_id is null (already the case for new column)
-- This is a no-op but documents intent
-- ============================================================================
COMMENT ON COLUMN journal_folders.parent_id IS 'Parent folder ID for nesting. NULL = root folder. Max depth enforced in functions.';

-- ============================================================================
-- Grant execute permissions on functions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_folder_path(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_folder_descendants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_folder_descendant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_folder_tree(UUID) TO authenticated;
