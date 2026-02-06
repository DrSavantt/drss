'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { Plus, Search, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { PageTreeNode } from './page-tree-node'
import { getPageTree, createPage, deletePage } from '@/app/actions/journal-pages'
import type { JournalPageTreeNode } from '@/types/journal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ============================================================================
// TYPES
// ============================================================================

interface PageTreeProps {
  /** Currently selected page ID */
  selectedPageId: string | null
  /** Callback when page is selected */
  onSelectPage: (pageId: string | null) => void
  /** Optional class name */
  className?: string
  /** Callback for refreshing tree (optional) */
  onTreeRefresh?: () => void
  /** Optional: Filter to only show pages with these IDs (and their parent chain) */
  filteredPageIds?: string[] | null
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'journal-expanded-pages'

// ============================================================================
// HELPERS
// ============================================================================

/** Get all page IDs in the tree (flattened) */
function getAllPageIds(pages: JournalPageTreeNode[]): string[] {
  const ids: string[] = []
  const collect = (nodes: JournalPageTreeNode[]) => {
    nodes.forEach(node => {
      ids.push(node.id)
      collect(node.children)
    })
  }
  collect(pages)
  return ids
}

/** Get visible page IDs (respecting expanded state) */
function getVisiblePageIds(
  pages: JournalPageTreeNode[],
  expandedPages: Set<string>
): string[] {
  const ids: string[] = []
  const collect = (nodes: JournalPageTreeNode[]) => {
    nodes.forEach(node => {
      ids.push(node.id)
      if (expandedPages.has(node.id) && node.children.length > 0) {
        collect(node.children)
      }
    })
  }
  collect(pages)
  return ids
}

/** Find a page by ID in the tree */
function findPageById(
  pages: JournalPageTreeNode[],
  id: string
): JournalPageTreeNode | null {
  for (const page of pages) {
    if (page.id === id) return page
    const found = findPageById(page.children, id)
    if (found) return found
  }
  return null
}

/** Filter pages by search query */
function filterPages(
  nodes: JournalPageTreeNode[],
  query: string
): JournalPageTreeNode[] {
  if (!query.trim()) return nodes

  const lowerQuery = query.toLowerCase()
  return nodes.reduce<JournalPageTreeNode[]>((acc, node) => {
    const matchesTitle = node.title.toLowerCase().includes(lowerQuery)
    const filteredChildren = filterPages(node.children, query)
    
    if (matchesTitle || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: matchesTitle ? node.children : filteredChildren,
      })
    }
    return acc
  }, [])
}

/** Filter pages by ID set (for tag filtering) - maintains tree structure */
function filterPagesByIds(
  nodes: JournalPageTreeNode[],
  allowedIds: Set<string>
): JournalPageTreeNode[] {
  return nodes.reduce<JournalPageTreeNode[]>((acc, node) => {
    const filteredChildren = filterPagesByIds(node.children, allowedIds)
    
    // Include this node if it's in the allowed set OR has children that are
    if (allowedIds.has(node.id) || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren,
      })
    }
    return acc
  }, [])
}

/** Get parent IDs that need to be expanded to show filtered pages */
function getParentIdsToExpand(
  nodes: JournalPageTreeNode[],
  targetIds: Set<string>,
  parentId: string | null = null
): string[] {
  const toExpand: string[] = []
  
  for (const node of nodes) {
    // Check if any of this node's descendants are in the target set
    const hasTargetDescendant = hasDescendantInSet(node.children, targetIds)
    
    if (hasTargetDescendant && node.children.length > 0) {
      toExpand.push(node.id)
      toExpand.push(...getParentIdsToExpand(node.children, targetIds, node.id))
    }
  }
  
  return toExpand
}

/** Check if any descendant is in the target set */
function hasDescendantInSet(
  nodes: JournalPageTreeNode[],
  targetIds: Set<string>
): boolean {
  for (const node of nodes) {
    if (targetIds.has(node.id)) return true
    if (hasDescendantInSet(node.children, targetIds)) return true
  }
  return false
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PageTree({
  selectedPageId,
  onSelectPage,
  className,
  onTreeRefresh,
  filteredPageIds,
}: PageTreeProps) {
  const [pages, setPages] = useState<JournalPageTreeNode[]>([])
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const nodeRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map())
  
  // Delete confirmation state
  const [deletePageId, setDeletePageId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load expanded state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setExpandedPages(new Set(parsed))
        }
      }
    } catch (e) {
      console.error('Failed to load expanded pages from localStorage:', e)
    }
  }, [])

  // Persist expanded state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedPages]))
    } catch (e) {
      console.error('Failed to save expanded pages to localStorage:', e)
    }
  }, [expandedPages])

  // Fetch page tree
  const fetchPages = useCallback(async () => {
    try {
      const tree = await getPageTree()
      setPages(tree)
    } catch (error) {
      console.error('Failed to fetch page tree:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // Expose refresh function
  useEffect(() => {
    if (onTreeRefresh) {
      // This allows parent to trigger a refresh
    }
  }, [onTreeRefresh])

  // Toggle expanded state for a page
  const handleToggleExpand = useCallback((pageId: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }, [])

  // Select a page
  const handleSelectPage = useCallback((pageId: string) => {
    onSelectPage(pageId)
  }, [onSelectPage])

  // Create new root page
  const handleCreateRootPage = async () => {
    startTransition(async () => {
      try {
        const result = await createPage('Untitled')
        await fetchPages()
        onSelectPage(result.id)
      } catch (error) {
        console.error('Failed to create page:', error)
      }
    })
  }

  // Add child page
  const handleAddChildPage = async (parentId: string) => {
    startTransition(async () => {
      try {
        const result = await createPage('Untitled', parentId)
        // Expand parent to show new child
        setExpandedPages(prev => new Set([...prev, parentId]))
        await fetchPages()
        onSelectPage(result.id)
      } catch (error) {
        console.error('Failed to create child page:', error)
      }
    })
  }

  // Delete page
  const handleDeletePage = async () => {
    if (!deletePageId) return
    
    setIsDeleting(true)
    try {
      await deletePage(deletePageId)
      
      // If deleted page was selected, clear selection
      if (selectedPageId === deletePageId) {
        onSelectPage(null)
      }
      
      await fetchPages()
    } catch (error) {
      console.error('Failed to delete page:', error)
    } finally {
      setIsDeleting(false)
      setDeletePageId(null)
    }
  }

  // Keyboard navigation handler
  const handleKeyboardNavigate = useCallback((
    direction: 'up' | 'down' | 'left' | 'right',
    currentId: string
  ) => {
    const visibleIds = getVisiblePageIds(pages, expandedPages)
    const currentIndex = visibleIds.indexOf(currentId)

    if (direction === 'down') {
      if (currentIndex < visibleIds.length - 1) {
        const nextId = visibleIds[currentIndex + 1]
        nodeRefs.current.get(nextId)?.focus()
      }
    } else if (direction === 'up') {
      if (currentIndex > 0) {
        const prevId = visibleIds[currentIndex - 1]
        nodeRefs.current.get(prevId)?.focus()
      }
    } else if (direction === 'right') {
      const page = findPageById(pages, currentId)
      if (page && page.children.length > 0 && expandedPages.has(currentId)) {
        nodeRefs.current.get(page.children[0].id)?.focus()
      }
    } else if (direction === 'left') {
      const page = findPageById(pages, currentId)
      if (page && page.parent_id) {
        nodeRefs.current.get(page.parent_id)?.focus()
      }
    }
  }, [pages, expandedPages])

  // Apply search filter first
  const searchFilteredPages = filterPages(pages, searchQuery)
  
  // Then apply tag filter if present
  const displayedPages = filteredPageIds 
    ? filterPagesByIds(searchFilteredPages, new Set(filteredPageIds))
    : searchFilteredPages

  // Expand all matching pages when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const allIds = getAllPageIds(displayedPages)
      setExpandedPages(new Set(allIds))
    }
  }, [searchQuery])
  
  // Auto-expand parents when tag filter is applied
  useEffect(() => {
    if (filteredPageIds && filteredPageIds.length > 0) {
      const targetSet = new Set(filteredPageIds)
      const parentsToExpand = getParentIdsToExpand(pages, targetSet)
      if (parentsToExpand.length > 0) {
        setExpandedPages(prev => new Set([...prev, ...parentsToExpand]))
      }
    }
  }, [filteredPageIds, pages])

  // Find page to delete for dialog
  const pageToDelete = deletePageId ? findPageById(pages, deletePageId) : null

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-medium text-foreground">Pages</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCreateRootPage}
          disabled={isPending}
          title="New Page"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Page Tree */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3" role="tree" aria-label="Journal pages">
        {loading ? (
          <div className="space-y-2 px-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-7 rounded-md bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : displayedPages.length > 0 ? (
          <div className="space-y-0.5">
            {displayedPages.map((page) => (
              <PageTreeNode
                key={page.id}
                page={page}
                expandedPages={expandedPages}
                selectedPageId={selectedPageId}
                onToggleExpand={handleToggleExpand}
                onSelectPage={handleSelectPage}
                onAddChildPage={handleAddChildPage}
                onRenamePage={() => {
                  // Rename happens in page view via inline title edit
                  handleSelectPage(page.id)
                }}
                onDeletePage={(id) => setDeletePageId(id)}
                onKeyboardNavigate={handleKeyboardNavigate}
                nodeRefs={nodeRefs}
              />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No pages match "{searchQuery}"
          </div>
        ) : filteredPageIds ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No pages with this tag
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No pages yet</p>
            <Button
              variant="link"
              size="sm"
              onClick={handleCreateRootPage}
              className="mt-1 h-auto p-0"
              disabled={isPending}
            >
              Create your first page
            </Button>
          </div>
        )}
      </nav>

      {/* New Page Button (bottom) */}
      <div className="border-t border-border px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleCreateRootPage}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Page
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePageId} onOpenChange={(open) => !open && setDeletePageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pageToDelete?.title || 'Untitled'}"?
              {pageToDelete && pageToDelete.child_count > 0 && (
                <span className="block mt-2 text-destructive">
                  This will also delete {pageToDelete.child_count} child page{pageToDelete.child_count > 1 ? 's' : ''}.
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePage}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Re-export the node component for external use if needed
export { PageTreeNode } from './page-tree-node'
