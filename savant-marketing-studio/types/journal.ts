/**
 * Journal System Types
 * 
 * Types for journal entries, chats, folders, and nested pages (Notion-style).
 */

// ============================================================================
// BASE TYPES (matching database schema)
// ============================================================================

/**
 * Journal folder from database
 */
export interface JournalFolder {
  id: string
  user_id: string
  name: string
  color: string | null
  position: number | null
  parent_id: string | null  // NULL = root folder
  created_at: string | null
  updated_at: string | null
}

/**
 * Journal chat from database
 */
export interface JournalChat {
  id: string
  user_id: string
  name: string
  type: 'inbox' | 'general' | 'client' | 'project' | 'content'
  linked_id: string | null
  folder_id: string | null
  deleted_at: string | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Journal entry from database
 * Now supports nested pages with title, parent_id, sort_order, and icon
 */
export interface JournalEntry {
  id: string
  user_id: string
  title: string  // Page title (backfilled from content for existing entries)
  content: string
  icon: string | null  // Emoji icon for the page
  parent_id: string | null  // Parent page ID (null = root page)
  sort_order: number  // Sort order among siblings
  mentioned_clients: string[] | null
  mentioned_projects: string[] | null
  mentioned_content: string[] | null
  tags: string[] | null
  is_pinned: boolean | null
  is_converted: boolean | null
  converted_to_content_id: string | null
  attachments: unknown | null
  voice_url: string | null
  chat_id: string | null
  deleted_at: string | null
  created_at: string | null
  updated_at: string | null
}

// ============================================================================
// TREE TYPES (for UI rendering)
// ============================================================================

/**
 * Folder tree node for hierarchical UI rendering
 * Extends JournalFolder with computed fields for tree display
 */
export interface JournalFolderTreeNode extends JournalFolder {
  /** Child folders */
  children: JournalFolderTreeNode[]
  /** Number of chats directly in this folder */
  chat_count: number
  /** Depth in tree (0 = root) */
  depth: number
  /** Whether folder is expanded in UI */
  isExpanded?: boolean
}

/**
 * Breadcrumb item for folder navigation
 */
export interface FolderBreadcrumb {
  id: string
  name: string
}

/**
 * Result from get_folder_path() database function
 */
export interface FolderPathResult {
  id: string
  name: string
  depth: number
}

/**
 * Result from get_folder_descendants() database function
 */
export interface FolderDescendantResult {
  id: string
  name: string
  parent_id: string | null
  depth: number
}

/**
 * Result from get_folder_tree() database function
 */
export interface FolderTreeResult {
  id: string
  name: string
  color: string | null
  sort_position: number | null  // Aliased from "position" in DB (reserved word)
  parent_id: string | null
  created_at: string | null
  updated_at: string | null
  chat_count: number
}

// ============================================================================
// NESTED PAGES TYPES (Notion-style)
// ============================================================================

/**
 * Result from get_page_tree() database function
 */
export interface PageTreeResult {
  id: string
  title: string
  icon: string | null
  parent_id: string | null
  sort_order: number
  has_children: boolean
  child_count: number
  created_at: string | null
  updated_at: string | null
}

/**
 * Page tree node for sidebar rendering
 * Built client-side from PageTreeResult with nested children
 */
export interface JournalPageTreeNode {
  id: string
  title: string
  icon: string | null
  parent_id: string | null
  sort_order: number
  has_children: boolean
  child_count: number
  created_at: string | null
  updated_at: string | null
  /** Child pages (built client-side from flat tree data) */
  children: JournalPageTreeNode[]
  /** Depth in tree (0 = root, calculated during tree building) */
  depth: number
  /** Whether page is expanded in UI (managed by component state) */
  isExpanded?: boolean
}

/**
 * Breadcrumb item for page navigation
 */
export interface PageBreadcrumb {
  id: string
  title: string
}

/**
 * Result from get_page_path() database function
 */
export interface PagePathResult {
  id: string
  title: string
  depth: number
}

/**
 * Result from get_page_descendants() database function
 */
export interface PageDescendantResult {
  id: string
  title: string
  parent_id: string | null
  depth: number
}

/**
 * Full page data for page view (with content and direct children)
 */
export interface JournalPage {
  id: string
  user_id: string
  title: string
  icon: string | null
  content: string
  parent_id: string | null
  sort_order: number
  tags: string[] | null
  mentioned_clients: string[] | null
  mentioned_projects: string[] | null
  mentioned_content: string[] | null
  is_pinned: boolean | null
  is_converted: boolean | null
  converted_to_content_id: string | null
  created_at: string | null
  updated_at: string | null
  /** Direct child pages (for inline display in page view) */
  children: JournalPageTreeNode[]
  /** Breadcrumb path from root to this page */
  breadcrumbs: PageBreadcrumb[]
}

/**
 * Input for creating a new page
 */
export interface CreatePageInput {
  title: string
  content?: string
  icon?: string | null
  parentId?: string | null
}

/**
 * Input for updating page metadata (not content)
 */
export interface UpdatePageMetaInput {
  title?: string
  icon?: string | null
}

/**
 * Input for moving a page to a new parent
 */
export interface MovePageInput {
  pageId: string
  newParentId: string | null  // null = move to root
}

// ============================================================================
// FORM/ACTION TYPES
// ============================================================================

/**
 * Input for creating a new folder
 */
export interface CreateFolderInput {
  name: string
  color?: string
  parentId?: string | null
}

/**
 * Input for updating a folder
 */
export interface UpdateFolderInput {
  name?: string
  color?: string
  position?: number
}

/**
 * Input for moving a folder to a new parent
 */
export interface MoveFolderInput {
  folderId: string
  newParentId: string | null  // null = move to root
}

/**
 * Input for moving a chat to a folder
 */
export interface MoveChatInput {
  chatId: string
  folderId: string | null  // null = remove from folder
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Folder expansion state for tree UI
 * Maps folder ID to expanded state
 */
export type FolderExpansionState = Record<string, boolean>

/**
 * Drag and drop data for folder/chat reordering
 */
export interface DragDropData {
  type: 'folder' | 'chat'
  id: string
  sourceParentId: string | null
}

/**
 * Drop target info
 */
export interface DropTarget {
  type: 'folder' | 'root'
  id: string | null
  position: 'before' | 'after' | 'inside'
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Folder with its chats loaded
 */
export interface FolderWithChats extends JournalFolder {
  chats: JournalChat[]
}

/**
 * Chat with its entries loaded
 */
export interface ChatWithEntries extends JournalChat {
  entries: JournalEntry[]
}

/**
 * Full folder tree node with chats
 */
export interface FolderTreeNodeWithChats extends JournalFolderTreeNode {
  chats: JournalChat[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum allowed folder nesting depth */
export const MAX_FOLDER_DEPTH = 10

/** Maximum allowed page nesting depth */
export const MAX_PAGE_DEPTH = 10

/** Default folder colors */
export const FOLDER_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6B7280', // gray
] as const

export type FolderColor = typeof FOLDER_COLORS[number]

/** Common page icons (emoji) */
export const PAGE_ICONS = [
  '📄', // document
  '📝', // memo
  '📋', // clipboard
  '📁', // folder
  '💡', // idea
  '⭐', // star
  '🎯', // target
  '🔥', // fire
  '💎', // gem
  '🚀', // rocket
  '📊', // chart
  '🔖', // bookmark
  '💬', // speech
  '✅', // check
  '❤️', // heart
  '🏠', // home
  '👤', // person
  '🎨', // art
  '📸', // camera
  '🎵', // music
] as const

export type PageIcon = typeof PAGE_ICONS[number]
