'use client'

import { useCallback, useRef, KeyboardEvent } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { JournalFolderTreeNode } from '@/types/journal'

// ============================================================================
// TYPES
// ============================================================================

interface FolderTreeNodeProps {
  /** Folder data */
  folder: JournalFolderTreeNode
  /** Set of expanded folder IDs */
  expandedFolders: Set<string>
  /** Currently selected folder ID */
  selectedFolderId: string | null
  /** Toggle folder expanded state */
  onToggleExpand: (folderId: string) => void
  /** Select folder */
  onSelectFolder: (folderId: string) => void
  /** Focus management for keyboard navigation */
  onKeyboardNavigate: (direction: 'up' | 'down' | 'left' | 'right', currentId: string) => void
  /** Ref for this node's button (for focus management) */
  nodeRefs: React.MutableRefObject<Map<string, HTMLButtonElement | null>>
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FolderTreeNode({
  folder,
  expandedFolders,
  selectedFolderId,
  onToggleExpand,
  onSelectFolder,
  onKeyboardNavigate,
  nodeRefs,
}: FolderTreeNodeProps) {
  const isExpanded = expandedFolders.has(folder.id)
  const isSelected = selectedFolderId === folder.id
  const hasChildren = folder.children.length > 0
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Register ref
  const setRef = useCallback((el: HTMLButtonElement | null) => {
    nodeRefs.current.set(folder.id, el)
  }, [folder.id, nodeRefs])

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        if (hasChildren && !isExpanded) {
          onToggleExpand(folder.id)
        } else if (hasChildren && isExpanded) {
          // Move to first child
          onKeyboardNavigate('right', folder.id)
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (hasChildren && isExpanded) {
          onToggleExpand(folder.id)
        } else if (folder.parent_id) {
          // Move to parent
          onKeyboardNavigate('left', folder.id)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        onKeyboardNavigate('up', folder.id)
        break
      case 'ArrowDown':
        e.preventDefault()
        onKeyboardNavigate('down', folder.id)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelectFolder(folder.id)
        break
    }
  }

  // Handle expand/collapse click (on chevron)
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      onToggleExpand(folder.id)
    }
  }

  // Handle folder name click (select folder)
  const handleSelectClick = () => {
    onSelectFolder(folder.id)
  }

  return (
    <div className="select-none">
      <Collapsible open={isExpanded && hasChildren} onOpenChange={() => hasChildren && onToggleExpand(folder.id)}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md transition-colors",
            isSelected
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
          style={{ paddingLeft: `${folder.depth * 16}px` }}
        >
          {/* Expand/Collapse Trigger */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-accent",
                !hasChildren && "invisible"
              )}
              onClick={handleToggleClick}
              tabIndex={-1}
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          {/* Folder Button */}
          <button
            ref={setRef}
            type="button"
            onClick={handleSelectClick}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex flex-1 items-center gap-2 py-1.5 pr-2 text-left text-sm outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
            )}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={hasChildren ? isExpanded : undefined}
          >
            {/* Color Indicator */}
            {folder.color && (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
            )}

            {/* Folder Icon */}
            {isExpanded && hasChildren ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}

            {/* Folder Name */}
            <span className="flex-1 truncate">{folder.name}</span>

            {/* Chat Count Badge */}
            <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
              {folder.chat_count > 0 && `(${folder.chat_count})`}
            </span>
          </button>
        </div>

        {/* Children */}
        {hasChildren && (
          <CollapsibleContent>
            <div role="group" className="mt-0.5">
              {folder.children.map((child) => (
                <FolderTreeNode
                  key={child.id}
                  folder={child}
                  expandedFolders={expandedFolders}
                  selectedFolderId={selectedFolderId}
                  onToggleExpand={onToggleExpand}
                  onSelectFolder={onSelectFolder}
                  onKeyboardNavigate={onKeyboardNavigate}
                  nodeRefs={nodeRefs}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}
