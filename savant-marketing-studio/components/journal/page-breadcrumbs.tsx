'use client'

import { ChevronRight, FileText, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PageBreadcrumb } from '@/types/journal'

// ============================================================================
// TYPES
// ============================================================================

interface PageBreadcrumbsProps {
  /** Breadcrumb items from root to current page */
  breadcrumbs: PageBreadcrumb[]
  /** Current page ID (for highlighting) */
  currentPageId?: string
  /** Callback when breadcrumb is clicked */
  onNavigate: (pageId: string | null) => void
  /** Optional class name */
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PageBreadcrumbs({
  breadcrumbs,
  currentPageId,
  onNavigate,
  className,
}: PageBreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      {/* Journal root link */}
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Home className="h-3.5 w-3.5" />
        <span>Journal</span>
      </button>

      {/* Breadcrumb items */}
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1
        const isCurrent = item.id === currentPageId

        return (
          <div key={item.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            
            <button
              type="button"
              onClick={() => !isCurrent && onNavigate(item.id)}
              disabled={isCurrent}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors max-w-[200px]",
                isCurrent
                  ? "text-foreground font-medium cursor-default"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span className="truncate">{item.title || 'Untitled'}</span>
            </button>
          </div>
        )
      })}
    </nav>
  )
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface PageBreadcrumbsCompactProps {
  /** Breadcrumb items from root to current page */
  breadcrumbs: PageBreadcrumb[]
  /** Callback when breadcrumb is clicked */
  onNavigate: (pageId: string | null) => void
  /** Optional class name */
  className?: string
}

/**
 * Compact breadcrumbs that collapse middle items when too long
 */
export function PageBreadcrumbsCompact({
  breadcrumbs,
  onNavigate,
  className,
}: PageBreadcrumbsCompactProps) {
  // If more than 3 items, show first, ..., last two
  const shouldCollapse = breadcrumbs.length > 3
  
  let displayItems: (PageBreadcrumb | { id: 'ellipsis'; title: '...' })[] = []
  
  if (shouldCollapse) {
    displayItems = [
      breadcrumbs[0],
      { id: 'ellipsis', title: '...' },
      ...breadcrumbs.slice(-2)
    ]
  } else {
    displayItems = breadcrumbs
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      {/* Journal root link */}
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Journal
      </button>

      {/* Breadcrumb items */}
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1
        const isEllipsis = item.id === 'ellipsis'

        return (
          <div key={item.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            
            {isEllipsis ? (
              <span className="text-muted-foreground px-1">...</span>
            ) : (
              <button
                type="button"
                onClick={() => !isLast && onNavigate(item.id)}
                disabled={isLast}
                className={cn(
                  "transition-colors max-w-[150px] truncate",
                  isLast
                    ? "text-foreground font-medium cursor-default"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.title || 'Untitled'}
              </button>
            )}
          </div>
        )
      })}
    </nav>
  )
}
