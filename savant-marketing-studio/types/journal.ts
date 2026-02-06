/**
 * Journal System Types
 * 
 * Types for journal entries, chats, and nested pages (Notion-style).
 */

// ============================================================================
// BASE TYPES (matching database schema)
// ============================================================================

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
  entry_type: 'capture' | 'page'  // Distinguishes captures from pages
  parent_id: string | null  // Parent page ID (null = root page)
  sort_order: number  // Sort order among siblings
  mentioned_clients: string[] | null
  mentioned_projects: string[] | null
  mentioned_content: string[] | null
  mentioned_pages: string[] | null  // Referenced journal pages via @mentions
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
// PAGE TYPES (Notion-style nested pages)
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
  entry_type: 'capture' | 'page'  // Distinguishes captures from pages
  content: string
  parent_id: string | null
  sort_order: number
  tags: string[] | null
  mentioned_clients: string[] | null
  mentioned_projects: string[] | null
  mentioned_content: string[] | null
  mentioned_pages: string[] | null  // Referenced journal pages via @mentions
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
// HELPER TYPES
// ============================================================================

/**
 * Chat with its entries loaded
 */
export interface ChatWithEntries extends JournalChat {
  entries: JournalEntry[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum allowed page nesting depth */
export const MAX_PAGE_DEPTH = 10

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
