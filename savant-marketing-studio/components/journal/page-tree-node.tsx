'use client'

import { useCallback, useRef, KeyboardEvent, useState } from 'react'
import { ChevronRight, ChevronDown, FileText, MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { JournalPageTreeNode } from '@/types/journal'

// ============================================================================
// TYPES
// ============================================================================

interface PageTreeNodeProps {
  /** Page data */
  page: JournalPageTreeNode
  /** Set of expanded page IDs */
  expandedPages: Set<string>
  /** Currently selected page ID */
  selectedPageId: string | null
  /** Toggle page expanded state */
  onToggleExpand: (pageId: string) => void
  /** Select page */
  onSelectPage: (pageId: string) => void
  /** Add child page */
  onAddChildPage?: (parentId: string) => void
  /** Rename page */
  onRenamePage?: (pageId: string) => void
  /** Delete page */
  onDeletePage?: (pageId: string) => void
  /** Focus management for keyboard navigation */
  onKeyboardNavigate: (direction: 'up' | 'down' | 'left' | 'right', currentId: string) => void
  /** Ref for this node's button (for focus management) */
  nodeRefs: React.MutableRefObject<Map<string, HTMLButtonElement | null>>
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PageTreeNode({
  page,
  expandedPages,
  selectedPageId,
  onToggleExpand,
  onSelectPage,
  onAddChildPage,
  onRenamePage,
  onDeletePage,
  onKeyboardNavigate,
  nodeRefs,
}: PageTreeNodeProps) {
  const isExpanded = expandedPages.has(page.id)
  const isSelected = selectedPageId === page.id
  const hasChildren = page.has_children || page.children.length > 0
  const [showMenu, setShowMenu] = useState(false)

  // Register ref
  const setRef = useCallback((el: HTMLButtonElement | null) => {
    nodeRefs.current.set(page.id, el)
  }, [page.id, nodeRefs])

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        if (hasChildren && !isExpanded) {
          onToggleExpand(page.id)
        } else if (hasChildren && isExpanded) {
          // Move to first child
          onKeyboardNavigate('right', page.id)
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (hasChildren && isExpanded) {
          onToggleExpand(page.id)
        } else if (page.parent_id) {
          // Move to parent
          onKeyboardNavigate('left', page.id)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        onKeyboardNavigate('up', page.id)
        break
      case 'ArrowDown':
        e.preventDefault()
        onKeyboardNavigate('down', page.id)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelectPage(page.id)
        break
    }
  }

  // Handle expand/collapse click (on chevron)
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      onToggleExpand(page.id)
    }
  }

  // Handle page name click (select page)
  const handleSelectClick = () => {
    onSelectPage(page.id)
  }

  // Get display icon (emoji or default)
  const displayIcon = page.icon || '📄'

  return (
    <div className="select-none">
      <Collapsible open={isExpanded && hasChildren} onOpenChange={() => hasChildren && onToggleExpand(page.id)}>
        <div
          className={cn(
            "group flex items-center gap-0.5 rounded-md transition-colors",
            isSelected
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
          style={{ paddingLeft: `${page.depth * 16}px` }}
        >
          {/* Expand/Collapse Trigger */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-accent",
                !hasChildren && "invisible"
              )}
              onClick={handleToggleClick}
              tabIndex={-1}
              aria-label={isExpanded ? 'Collapse page' : 'Expand page'}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          {/* Page Button */}
          <button
            ref={setRef}
            type="button"
            onClick={handleSelectClick}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex flex-1 items-center gap-2 py-1.5 pr-1 text-left text-sm outline-none min-w-0",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
            )}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={hasChildren ? isExpanded : undefined}
          >
            {/* Page Icon (Emoji) */}
            <span className="text-base shrink-0 leading-none">{displayIcon}</span>

            {/* Page Title */}
            <span className="flex-1 truncate">{page.title || 'Untitled'}</span>

            {/* Child Count Badge */}
            {page.child_count > 0 && (
              <span className="shrink-0 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full tabular-nums">
                {page.child_count}
              </span>
            )}
          </button>

          {/* Actions Menu */}
          <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded",
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  "hover:bg-accent transition-opacity",
                  showMenu && "opacity-100"
                )}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {onAddChildPage && (
                <DropdownMenuItem onClick={() => onAddChildPage(page.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add child page
                </DropdownMenuItem>
              )}
              {onRenamePage && (
                <DropdownMenuItem onClick={() => onRenamePage(page.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              )}
              {(onAddChildPage || onRenamePage) && onDeletePage && (
                <DropdownMenuSeparator />
              )}
              {onDeletePage && (
                <DropdownMenuItem 
                  onClick={() => onDeletePage(page.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {hasChildren && (
          <CollapsibleContent>
            <div role="group" className="mt-0.5">
              {page.children.map((child) => (
                <PageTreeNode
                  key={child.id}
                  page={child}
                  expandedPages={expandedPages}
                  selectedPageId={selectedPageId}
                  onToggleExpand={onToggleExpand}
                  onSelectPage={onSelectPage}
                  onAddChildPage={onAddChildPage}
                  onRenamePage={onRenamePage}
                  onDeletePage={onDeletePage}
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
