'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Loader2, 
  MessageSquare, 
  Send, 
  ArrowRight,
  ChevronDown,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PageCard, PageCardSkeleton, type PageCardData } from './page-card'
import { 
  getRootPagesWithPreview, 
  createQuickCapture, 
  getCaptures, 
  promoteToPage 
} from '@/app/actions/journal-pages'
import { cn, stripHtml } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import type { JournalEntry } from '@/types/journal'

// ============================================================================
// TYPES
// ============================================================================

interface PageLibraryProps {
  /** Callback when a page is selected */
  onSelectPage: (pageId: string) => void
  /** Callback when creating a new page */
  onCreatePage: () => void
  /** Whether a page is currently being created */
  isCreating?: boolean
  /** Optional class name */
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_CAPTURES_SHOWN = 8
const CAPTURES_INCREMENT = 10

// ============================================================================
// CAPTURE ITEM COMPONENT
// ============================================================================

interface CaptureItemProps {
  capture: JournalEntry
  onPromote: (id: string) => void
  onSelect: (id: string) => void
  isPromoting: boolean
}

function CaptureItem({ capture, onPromote, onSelect, isPromoting }: CaptureItemProps) {
  const [expanded, setExpanded] = useState(false)
  const plainText = stripHtml(capture.content || '')
  const isLong = plainText.length > 180

  return (
    <div
      className="group p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => {
        if (isLong) {
          setExpanded(!expanded)
        } else {
          onSelect(capture.id)
        }
      }}
    >
      {/* Content */}
      <p
        className={cn(
          'text-sm whitespace-pre-wrap break-words',
          !expanded && isLong && 'line-clamp-3'
        )}
      >
        {plainText}
      </p>

      {/* Expand hint for long content */}
      {isLong && !expanded && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(true)
          }}
          className="text-xs text-primary hover:underline mt-1"
        >
          Show more
        </button>
      )}
      {isLong && expanded && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(false)
          }}
          className="text-xs text-primary hover:underline mt-1"
        >
          Show less
        </button>
      )}

      {/* Footer: timestamp, tags, promote */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          {capture.created_at
            ? formatDistanceToNow(new Date(capture.created_at), { addSuffix: true })
            : 'just now'}
        </div>

        <div className="flex items-center gap-2">
          {/* Tags */}
          {capture.tags && capture.tags.length > 0 && (
            <div className="flex gap-1">
              {capture.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5"
                >
                  #{tag}
                </Badge>
              ))}
              {capture.tags.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5"
                >
                  +{capture.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Promote to page */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onPromote(capture.id)
            }}
            disabled={isPromoting}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Make Page
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PageLibrary({
  onSelectPage,
  onCreatePage,
  isCreating = false,
  className,
}: PageLibraryProps) {
  // Page state
  const [pages, setPages] = useState<PageCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Capture state
  const [captures, setCaptures] = useState<JournalEntry[]>([])
  const [capturesLoading, setCapturesLoading] = useState(true)
  const [captureContent, setCaptureContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [visibleCount, setVisibleCount] = useState(INITIAL_CAPTURES_SHOWN)
  const [promotingId, setPromotingId] = useState<string | null>(null)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchCaptures = useCallback(async () => {
    try {
      const data = await getCaptures(50)
      setCaptures(data)
    } catch (err) {
      console.error('Failed to fetch captures:', err)
    } finally {
      setCapturesLoading(false)
    }
  }, [])

  const fetchPages = useCallback(async () => {
    try {
      const rootPages = await getRootPagesWithPreview()
      setPages(rootPages)
    } catch (err) {
      console.error('Failed to fetch pages:', err)
      setError('Failed to load pages')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch both on mount
  useEffect(() => {
    fetchCaptures()
    fetchPages()
  }, [fetchCaptures, fetchPages])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleQuickCapture = async () => {
    const content = captureContent.trim()
    if (!content || isSaving) return

    setIsSaving(true)
    try {
      const result = await createQuickCapture(content)

      if (!result.success) {
        throw new Error(result.error || 'Failed to save capture')
      }

      setCaptureContent('')

      // Optimistically add to feed at top
      const optimisticEntry: JournalEntry = {
        id: result.data?.id || crypto.randomUUID(),
        user_id: '',
        title: result.data?.title || content.slice(0, 50),
        content: `<p>${content.replace(/\n/g, '</p><p>')}</p>`,
        icon: '📝',
        entry_type: 'capture',
        parent_id: null,
        sort_order: 0,
        mentioned_clients: null,
        mentioned_projects: null,
        mentioned_content: null,
        mentioned_pages: null,
        tags: null,
        is_pinned: null,
        is_converted: null,
        converted_to_content_id: null,
        attachments: null,
        voice_url: null,
        chat_id: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setCaptures((prev) => [optimisticEntry, ...prev])

      toast.success('Capture saved')

      // Refresh in background for accurate data
      fetchCaptures()
    } catch (err) {
      console.error('Failed to create capture:', err)
      toast.error('Failed to save capture')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuickCapture()
    }
  }

  const handlePromoteToPage = async (entryId: string) => {
    setPromotingId(entryId)
    try {
      await promoteToPage(entryId)
      toast.success('Promoted to page')
      // Remove from captures, refresh pages
      setCaptures((prev) => prev.filter((c) => c.id !== entryId))
      fetchPages()
    } catch (err) {
      console.error('Failed to promote capture:', err)
      toast.error('Failed to promote to page')
    } finally {
      setPromotingId(null)
    }
  }

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + CAPTURES_INCREMENT)
  }

  // Filter pages by search query
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages

    const query = searchQuery.toLowerCase()
    return pages.filter(
      (page) =>
        page.title.toLowerCase().includes(query) ||
        page.content_preview?.toLowerCase().includes(query)
    )
  }, [pages, searchQuery])

  const visibleCaptures = captures.slice(0, visibleCount)
  const hasMoreCaptures = captures.length > visibleCount

  // ============================================================================
  // RENDER: Loading State
  // ============================================================================

  if (loading && capturesLoading) {
    return (
      <div className={className}>
        {/* Capture input skeleton */}
        <div className="mb-8">
          <div className="h-[80px] w-full rounded-lg bg-muted animate-pulse" />
        </div>

        {/* Captures skeleton */}
        <div className="mb-8">
          <div className="h-5 w-32 bg-muted animate-pulse rounded mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>

        {/* Pages skeleton */}
        <div>
          <div className="h-5 w-28 bg-muted animate-pulse rounded mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <PageCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER: Error State
  // ============================================================================

  if (error) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER: Main View
  // ============================================================================

  return (
    <div className={className}>
      {/* ── Quick Capture Input ───────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="relative">
          <Textarea
            value={captureContent}
            onChange={(e) => setCaptureContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? (Enter to save, Shift+Enter for new line)"
            disabled={isSaving}
            className="min-h-[80px] max-h-[200px] resize-none pr-12 text-sm"
            rows={2}
          />
          {isSaving ? (
            <div className="absolute right-3 bottom-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : captureContent.trim().length > 0 ? (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 bottom-2 h-7 w-7 text-primary hover:text-primary"
              onClick={handleQuickCapture}
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Press Enter to save · Shift+Enter for new line · Supports @mentions and #tags
        </p>
      </div>

      {/* ── Recent Captures Feed ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Captures
          </h3>
          {captures.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5">
              {captures.length}
            </Badge>
          )}
        </div>

        {capturesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : captures.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">No captures yet</h3>
            <p className="text-xs text-muted-foreground">
              Type a thought above and press Enter to start capturing
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleCaptures.map((capture) => (
              <CaptureItem
                key={capture.id}
                capture={capture}
                onPromote={handlePromoteToPage}
                onSelect={onSelectPage}
                isPromoting={promotingId === capture.id}
              />
            ))}

            {hasMoreCaptures && (
              <button
                onClick={handleShowMore}
                className="w-full py-2 text-xs text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronDown className="h-3 w-3" />
                Show more ({captures.length - visibleCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="border-t border-border mb-6" />

      {/* ── Your Pages Section ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Your Pages
            </h3>
            {pages.length > 0 && (
              <Badge variant="secondary" className="text-xs h-5">
                {pages.length}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onCreatePage}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Page
              </>
            )}
          </Button>
        </div>

        {/* Search (only show when there are pages) */}
        {pages.length > 3 && (
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {pages.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">No pages yet</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Create pages to organize your ideas, notes, and research
            </p>
            <Button size="sm" onClick={onCreatePage} disabled={isCreating}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Your First Page
            </Button>
          </div>
        )}

        {/* No search results */}
        {filteredPages.length === 0 && searchQuery && pages.length > 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">No pages found</h3>
            <p className="text-xs text-muted-foreground">
              No pages match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}

        {/* Pages Grid */}
        {filteredPages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.map((page) => (
              <PageCard key={page.id} page={page} onSelect={onSelectPage} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
