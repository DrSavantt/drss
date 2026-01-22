'use client'

import { FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export interface PageCardData {
  id: string
  title: string
  icon: string | null
  child_count: number
  updated_at: string | null
  content_preview?: string
}

interface PageCardProps {
  page: PageCardData
  onSelect: (pageId: string) => void
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format relative time from ISO date string
 */
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  
  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return `${diffMonths}mo ago`
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PageCard({ page, onSelect, className }: PageCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5",
        "bg-card border-border",
        className
      )}
      onClick={() => onSelect(page.id)}
    >
      <CardContent className="p-4">
        {/* Icon */}
        <div className="text-3xl mb-3">
          {page.icon || '📄'}
        </div>
        
        {/* Title */}
        <h3 className="font-semibold text-foreground truncate mb-2 group-hover:text-primary transition-colors">
          {page.title || 'Untitled'}
        </h3>
        
        {/* Content Preview */}
        {page.content_preview ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
            {page.content_preview}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic mb-4 min-h-[2.5rem]">
            No content yet
          </p>
        )}
        
        {/* Footer: Child count and timestamp */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {page.child_count} page{page.child_count !== 1 ? 's' : ''}
          </span>
          {page.updated_at && (
            <span>
              {formatRelativeTime(page.updated_at)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

export function PageCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        {/* Icon skeleton */}
        <div className="h-8 w-8 rounded bg-muted animate-pulse mb-3" />
        
        {/* Title skeleton */}
        <div className="h-5 w-3/4 rounded bg-muted animate-pulse mb-2" />
        
        {/* Preview skeleton */}
        <div className="space-y-1.5 mb-4 min-h-[2.5rem]">
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
        </div>
        
        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          <div className="h-3 w-12 rounded bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
