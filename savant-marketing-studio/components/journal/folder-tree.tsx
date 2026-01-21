'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, FolderPlus, Inbox, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FolderTreeNode } from './folder-tree-node'
import { getJournalFolderTree } from '@/app/actions/journal-folders'
import type { JournalFolderTreeNode } from '@/types/journal'

// ============================================================================
// TYPES
// ============================================================================

interface FolderTreeProps {
  /** Currently selected folder ID */
  selectedFolderId: string | null
  /** Callback when folder is selected */
  onSelectFolder: (folderId: string | null) => void
  /** Callback to open create folder dialog */
  onCreateFolder: () => void
  /** Count of chats without folders (Quick Captures) */
  quickCaptureCount: number
  /** Whether Quick Captures is selected */
  isQuickCaptureSelected: boolean
  /** Select Quick Captures */
  onSelectQuickCaptures: () => void
  /** Optional class name */
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'journal-expanded-folders'

// ============================================================================
// HELPERS
// ============================================================================

/** Get all folder IDs in the tree (flattened) */
function getAllFolderIds(folders: JournalFolderTreeNode[]): string[] {
  const ids: string[] = []
  const collect = (nodes: JournalFolderTreeNode[]) => {
    nodes.forEach(node => {
      ids.push(node.id)
      collect(node.children)
    })
  }
  collect(folders)
  return ids
}

/** Get visible folder IDs (respecting expanded state) */
function getVisibleFolderIds(
  folders: JournalFolderTreeNode[],
  expandedFolders: Set<string>
): string[] {
  const ids: string[] = []
  const collect = (nodes: JournalFolderTreeNode[]) => {
    nodes.forEach(node => {
      ids.push(node.id)
      if (expandedFolders.has(node.id) && node.children.length > 0) {
        collect(node.children)
      }
    })
  }
  collect(folders)
  return ids
}

/** Find a folder by ID in the tree */
function findFolderById(
  folders: JournalFolderTreeNode[],
  id: string
): JournalFolderTreeNode | null {
  for (const folder of folders) {
    if (folder.id === id) return folder
    const found = findFolderById(folder.children, id)
    if (found) return found
  }
  return null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FolderTree({
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  quickCaptureCount,
  isQuickCaptureSelected,
  onSelectQuickCaptures,
  className,
}: FolderTreeProps) {
  const [folders, setFolders] = useState<JournalFolderTreeNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const nodeRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map())
  const quickCaptureRef = useRef<HTMLButtonElement>(null)

  // Load expanded state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setExpandedFolders(new Set(parsed))
        }
      }
    } catch (e) {
      console.error('Failed to load expanded folders from localStorage:', e)
    }
  }, [])

  // Persist expanded state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedFolders]))
    } catch (e) {
      console.error('Failed to save expanded folders to localStorage:', e)
    }
  }, [expandedFolders])

  // Fetch folder tree
  useEffect(() => {
    async function fetchFolders() {
      try {
        const tree = await getJournalFolderTree()
        setFolders(tree)
      } catch (error) {
        console.error('Failed to fetch folder tree:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFolders()
  }, [])

  // Toggle expanded state for a folder
  const handleToggleExpand = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  // Select a folder
  const handleSelectFolder = useCallback((folderId: string) => {
    onSelectFolder(folderId)
  }, [onSelectFolder])

  // Keyboard navigation handler
  const handleKeyboardNavigate = useCallback((
    direction: 'up' | 'down' | 'left' | 'right',
    currentId: string
  ) => {
    const visibleIds = getVisibleFolderIds(folders, expandedFolders)
    const currentIndex = visibleIds.indexOf(currentId)

    if (direction === 'down') {
      // Move to next visible item
      if (currentIndex < visibleIds.length - 1) {
        const nextId = visibleIds[currentIndex + 1]
        nodeRefs.current.get(nextId)?.focus()
      } else {
        // Move to Quick Captures
        quickCaptureRef.current?.focus()
      }
    } else if (direction === 'up') {
      // Move to previous visible item
      if (currentIndex > 0) {
        const prevId = visibleIds[currentIndex - 1]
        nodeRefs.current.get(prevId)?.focus()
      }
    } else if (direction === 'right') {
      // Move to first child (if expanded)
      const folder = findFolderById(folders, currentId)
      if (folder && folder.children.length > 0 && expandedFolders.has(currentId)) {
        nodeRefs.current.get(folder.children[0].id)?.focus()
      }
    } else if (direction === 'left') {
      // Move to parent
      const folder = findFolderById(folders, currentId)
      if (folder && folder.parent_id) {
        nodeRefs.current.get(folder.parent_id)?.focus()
      }
    }
  }, [folders, expandedFolders])

  // Handle Quick Captures keyboard navigation
  const handleQuickCaptureKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const visibleIds = getVisibleFolderIds(folders, expandedFolders)
      if (visibleIds.length > 0) {
        const lastId = visibleIds[visibleIds.length - 1]
        nodeRefs.current.get(lastId)?.focus()
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectQuickCaptures()
    }
  }

  // Filter folders by search query
  const filterFolders = useCallback((
    nodes: JournalFolderTreeNode[],
    query: string
  ): JournalFolderTreeNode[] => {
    if (!query.trim()) return nodes

    const lowerQuery = query.toLowerCase()
    return nodes.reduce<JournalFolderTreeNode[]>((acc, node) => {
      const matchesName = node.name.toLowerCase().includes(lowerQuery)
      const filteredChildren = filterFolders(node.children, query)
      
      if (matchesName || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: matchesName ? node.children : filteredChildren,
        })
      }
      return acc
    }, [])
  }, [])

  const displayedFolders = filterFolders(folders, searchQuery)

  // Expand all matching folders when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      // Auto-expand all folders when searching to show matches
      const allIds = getAllFolderIds(displayedFolders)
      setExpandedFolders(new Set(allIds))
    }
  }, [searchQuery, displayedFolders])

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Folders</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCreateFolder}
            title="New Folder"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Folder Tree */}
        <nav className="px-3 pb-3" role="tree" aria-label="Journal folders">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 rounded-md bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : displayedFolders.length > 0 ? (
            <div className="space-y-0.5">
              {displayedFolders.map((folder) => (
                <FolderTreeNode
                  key={folder.id}
                  folder={folder}
                  expandedFolders={expandedFolders}
                  selectedFolderId={selectedFolderId}
                  onToggleExpand={handleToggleExpand}
                  onSelectFolder={handleSelectFolder}
                  onKeyboardNavigate={handleKeyboardNavigate}
                  nodeRefs={nodeRefs}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No folders match "{searchQuery}"
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p>No folders yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={onCreateFolder}
                className="mt-1 h-auto p-0"
              >
                Create your first folder
              </Button>
            </div>
          )}

          {/* Divider */}
          <div className="my-3 border-t border-border" />

          {/* Quick Captures (Unorganized) */}
          <button
            ref={quickCaptureRef}
            type="button"
            onClick={onSelectQuickCaptures}
            onKeyDown={handleQuickCaptureKeyDown}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-none",
              isQuickCaptureSelected
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            )}
            role="treeitem"
            aria-selected={isQuickCaptureSelected}
          >
            <Inbox className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1">Quick Captures</span>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {quickCaptureCount > 0 && `(${quickCaptureCount})`}
            </span>
          </button>
        </nav>
      </CardContent>
    </Card>
  )
}

// Re-export the node component for external use if needed
export { FolderTreeNode } from './folder-tree-node'
