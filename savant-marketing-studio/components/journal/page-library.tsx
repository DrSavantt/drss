'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { 
  Plus, 
  Search, 
  Loader2, 
  MessageSquare, 
  Send, 
  ArrowRight,
  ChevronDown,
  FileText,
  Trash2,
  Pin,
  Tag,
  X,
  ArrowUpRight,
  FolderInput,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageCard, PageCardSkeleton, type PageCardData } from './page-card'
import { 
  getRootPagesWithPreview, 
  createQuickCapture, 
  getCaptures, 
  promoteToPage,
  deletePage,
  bulkDeleteCaptures,
  bulkPromoteToPages,
  bulkPinCaptures,
  bulkUnpinCaptures,
  bulkAddTags,
  bulkMoveToParent,
} from '@/app/actions/journal-pages'
import type { RootPageWithPreview } from '@/app/actions/journal-pages'
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
  onPromote: () => void
  onDelete: () => void
  onTogglePin: () => void
  isPromoting: boolean
  isSelected: boolean
  onToggleSelect: () => void
  isSelectionMode: boolean
  isDisabled: boolean
}

function CaptureItem({ capture, onPromote, onDelete, onTogglePin, isPromoting, isSelected, onToggleSelect, isSelectionMode, isDisabled }: CaptureItemProps) {
  const [expanded, setExpanded] = useState(false)
  const plainText = stripHtml(capture.content || '')
  const isLong = plainText.length > 180

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg border transition-all",
        isDisabled
          ? "opacity-50 cursor-default border-border bg-card"
          : isSelected
            ? "cursor-pointer border-primary ring-2 ring-primary/50 bg-primary/5"
            : "cursor-pointer border-border bg-card hover:bg-muted/30"
      )}
      onClick={() => {
        if (isDisabled) return
        if (isSelectionMode) {
          onToggleSelect()
        } else {
          setExpanded(!expanded)
        }
      }}
    >
      {/* Checkbox — hidden when disabled, appears on hover */}
      {!isDisabled && (
        <div
          className={cn(
            "flex-shrink-0 p-1.5 -m-1 rounded transition-all duration-150",
            isSelectionMode || isSelected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-70"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect()}
            className="size-4 transition-transform duration-150"
          />
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Content */}
        <p
          className={cn(
            'text-sm whitespace-pre-wrap break-words',
            !expanded && isLong && 'line-clamp-3'
          )}
        >
          {plainText}
        </p>

        {/* Expand/collapse hint for long content */}
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

        {/* Collapsed footer: relative timestamp, pin icon, compact tags */}
        {!expanded && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {capture.created_at
                ? formatDistanceToNow(new Date(capture.created_at), { addSuffix: true })
                : 'just now'}
              {capture.is_pinned && (
                <Pin className="h-3 w-3 text-primary fill-primary" />
              )}
            </div>

            <div className="flex items-center gap-2">
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
            </div>
          </div>
        )}

        {/* Expanded: full timestamp, all tags, action buttons */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            {/* Full timestamp + pin indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {capture.created_at
                ? new Date(capture.created_at).toLocaleString()
                : 'just now'}
              {capture.is_pinned && (
                <Pin className="h-3 w-3 text-primary fill-primary" />
              )}
            </div>

            {/* All tags */}
            {capture.tags && capture.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {capture.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action buttons — always visible when expanded */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onPromote()
                }}
                disabled={isPromoting}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                {isPromoting ? 'Promoting...' : 'Make Page'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePin()
                }}
              >
                <Pin className={cn("h-3 w-3 mr-1", capture.is_pinned && "fill-primary text-primary")} />
                {capture.is_pinned ? 'Unpin' : 'Pin'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs hover:text-destructive hover:border-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
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

  // Selection state (unified for captures and pages)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectionType, setSelectionType] = useState<'captures' | 'pages' | null>(null)

  // Bulk action loading states
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkPromoting, setBulkPromoting] = useState(false)
  const [bulkPinning, setBulkPinning] = useState(false)
  const [bulkTagging, setBulkTagging] = useState(false)
  const [bulkMoving, setBulkMoving] = useState(false)

  // Tag popover state
  const [tagInput, setTagInput] = useState('')
  const [pendingTags, setPendingTags] = useState<string[]>([])
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Move-to-page dropdown state
  const [movePages, setMovePages] = useState<RootPageWithPreview[]>([])
  const [movePagesLoading, setMovePagesLoading] = useState(false)

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

  const handleSingleDelete = async (entryId: string) => {
    if (!window.confirm('Delete this capture?')) return

    try {
      await deletePage(entryId)
      setCaptures(prev => prev.filter(c => c.id !== entryId))
      toast.success('Capture deleted')
    } catch (err) {
      console.error('Failed to delete capture:', err)
      toast.error('Failed to delete capture')
    }
  }

  const handleSinglePinToggle = async (entryId: string) => {
    const capture = captures.find(c => c.id === entryId)
    if (!capture) return

    const isPinned = capture.is_pinned

    try {
      if (isPinned) {
        await bulkUnpinCaptures([entryId])
      } else {
        await bulkPinCaptures([entryId])
      }
      setCaptures(prev => prev.map(c =>
        c.id === entryId ? { ...c, is_pinned: !isPinned } : c
      ))
      toast.success(isPinned ? 'Capture unpinned' : 'Capture pinned')
    } catch (err) {
      console.error('Failed to toggle pin:', err)
      toast.error('Failed to update pin status')
    }
  }

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + CAPTURES_INCREMENT)
  }

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  // Filter pages by search query (must be above selection helpers for toggleSelectAllPages)
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages

    const query = searchQuery.toLowerCase()
    return pages.filter(
      (page) =>
        page.title.toLowerCase().includes(query) ||
        page.content_preview?.toLowerCase().includes(query)
    )
  }, [pages, searchQuery])

  // ============================================================================
  // SELECTION HELPERS
  // ============================================================================

  const toggleSelect = useCallback((id: string, type: 'capture' | 'page') => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      if (next.length > 0) {
        setIsSelectionMode(true)
        setSelectionType(type === 'capture' ? 'captures' : 'pages')
      } else {
        setIsSelectionMode(false)
        setSelectionType(null)
      }
      return next
    })
  }, [])

  const toggleSelectAllCaptures = useCallback(() => {
    const visible = captures.slice(0, visibleCount)
    if (selectedIds.length === visible.length) {
      setSelectedIds([])
      setIsSelectionMode(false)
      setSelectionType(null)
    } else {
      setSelectedIds(visible.map(c => c.id))
      setIsSelectionMode(true)
      setSelectionType('captures')
    }
  }, [captures, visibleCount, selectedIds.length])

  const toggleSelectAllPages = useCallback(() => {
    if (selectedIds.length === filteredPages.length) {
      setSelectedIds([])
      setIsSelectionMode(false)
      setSelectionType(null)
    } else {
      setSelectedIds(filteredPages.map(p => p.id))
      setIsSelectionMode(true)
      setSelectionType('pages')
    }
  }, [filteredPages, selectedIds.length])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
    setIsSelectionMode(false)
    setSelectionType(null)
  }, [])

  // Escape key clears selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectionMode) {
        clearSelection()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSelectionMode, clearSelection])

  // ============================================================================
  // BULK ACTION HANDLERS
  // ============================================================================

  const handleBulkDelete = async () => {
    const label = selectionType === 'pages' ? 'page' : 'capture'
    if (!window.confirm(`Delete ${selectedIds.length} ${label}${selectedIds.length !== 1 ? 's' : ''}?`)) return

    setBulkDeleting(true)
    try {
      const result = await bulkDeleteCaptures(selectedIds)
      if (!result.success) {
        toast.error(result.error || `Failed to delete ${label}s`)
        return
      }
      // Optimistically remove from the correct list
      if (selectionType === 'pages') {
        setPages(prev => prev.filter(p => !selectedIds.includes(p.id)))
      } else {
        setCaptures(prev => prev.filter(c => !selectedIds.includes(c.id)))
      }
      toast.success(`${result.deleted ?? selectedIds.length} ${label}${(result.deleted ?? selectedIds.length) !== 1 ? 's' : ''} deleted`)
      clearSelection()
    } catch (err) {
      console.error('Failed to bulk delete:', err)
      toast.error(`Failed to delete ${label}s`)
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleBulkPromote = async () => {
    setBulkPromoting(true)
    try {
      const result = await bulkPromoteToPages(selectedIds)
      if (!result.success) {
        toast.error(result.error || 'Failed to promote captures')
        return
      }
      // Remove promoted from captures, refresh pages
      setCaptures(prev => prev.filter(c => !selectedIds.includes(c.id)))
      fetchPages()
      toast.success(`${result.promoted ?? selectedIds.length} capture${(result.promoted ?? selectedIds.length) !== 1 ? 's' : ''} promoted to pages`)
      clearSelection()
    } catch (err) {
      console.error('Failed to bulk promote:', err)
      toast.error('Failed to promote captures')
    } finally {
      setBulkPromoting(false)
    }
  }

  const handleBulkPinToggle = async () => {
    const label = selectionType === 'pages' ? 'page' : 'capture'
    // For captures we can check pin state; for pages we default to pinning
    const allPinned = selectionType === 'captures'
      ? captures.filter(c => selectedIds.includes(c.id)).every(c => c.is_pinned)
      : false

    setBulkPinning(true)
    try {
      if (allPinned) {
        const result = await bulkUnpinCaptures(selectedIds)
        if (!result.success) {
          toast.error(result.error || `Failed to unpin ${label}s`)
          return
        }
        if (selectionType === 'captures') {
          setCaptures(prev => prev.map(c =>
            selectedIds.includes(c.id) ? { ...c, is_pinned: false } : c
          ))
        } else {
          fetchPages()
        }
        toast.success(`${result.unpinned ?? selectedIds.length} ${label}${(result.unpinned ?? selectedIds.length) !== 1 ? 's' : ''} unpinned`)
      } else {
        const result = await bulkPinCaptures(selectedIds)
        if (!result.success) {
          toast.error(result.error || `Failed to pin ${label}s`)
          return
        }
        if (selectionType === 'captures') {
          setCaptures(prev => prev.map(c =>
            selectedIds.includes(c.id) ? { ...c, is_pinned: true } : c
          ))
        } else {
          fetchPages()
        }
        toast.success(`${result.pinned ?? selectedIds.length} ${label}${(result.pinned ?? selectedIds.length) !== 1 ? 's' : ''} pinned`)
      }
      clearSelection()
    } catch (err) {
      console.error('Failed to bulk pin/unpin:', err)
      toast.error('Failed to update pin status')
    } finally {
      setBulkPinning(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !pendingTags.includes(tag)) {
      setPendingTags(prev => [...prev, tag])
    }
    setTagInput('')
    tagInputRef.current?.focus()
  }

  const handleRemovePendingTag = (tag: string) => {
    setPendingTags(prev => prev.filter(t => t !== tag))
  }

  const handleApplyTags = async () => {
    if (pendingTags.length === 0) return

    setBulkTagging(true)
    try {
      const result = await bulkAddTags(selectedIds, pendingTags)
      if (!result.success) {
        toast.error(result.error || 'Failed to add tags')
        return
      }
      const tagLabel = selectionType === 'pages' ? 'page' : 'capture'
      toast.success(`Tags added to ${result.tagged ?? selectedIds.length} ${tagLabel}${(result.tagged ?? selectedIds.length) !== 1 ? 's' : ''}`)
      setPendingTags([])
      setTagInput('')
      setTagPopoverOpen(false)
      clearSelection()
      if (selectionType === 'pages') fetchPages()
      else fetchCaptures()
    } catch (err) {
      console.error('Failed to bulk add tags:', err)
      toast.error('Failed to add tags')
    } finally {
      setBulkTagging(false)
    }
  }

  const handleFetchMovePages = async () => {
    setMovePagesLoading(true)
    try {
      const pages = await getRootPagesWithPreview()
      setMovePages(pages)
    } catch (err) {
      console.error('Failed to fetch pages for move:', err)
      setMovePages([])
    } finally {
      setMovePagesLoading(false)
    }
  }

  const handleBulkMove = async (parentId: string | null) => {
    const label = selectionType === 'pages' ? 'page' : 'capture'
    setBulkMoving(true)
    try {
      const result = await bulkMoveToParent(selectedIds, parentId)
      if (!result.success) {
        toast.error(result.error || `Failed to move ${label}s`)
        return
      }
      if (parentId) {
        // Moved under a page — remove from the correct list
        if (selectionType === 'pages') {
          setPages(prev => prev.filter(p => !selectedIds.includes(p.id)))
        } else {
          setCaptures(prev => prev.filter(c => !selectedIds.includes(c.id)))
        }
        const targetPage = movePages.find(p => p.id === parentId)
        toast.success(`${result.moved ?? selectedIds.length} ${label}${(result.moved ?? selectedIds.length) !== 1 ? 's' : ''} moved to ${targetPage?.title || 'page'}`)
      } else {
        toast.success(`${result.moved ?? selectedIds.length} ${label}${(result.moved ?? selectedIds.length) !== 1 ? 's' : ''} moved to root level`)
      }
      clearSelection()
    } catch (err) {
      console.error('Failed to bulk move:', err)
      toast.error(`Failed to move ${label}s`)
    } finally {
      setBulkMoving(false)
    }
  }

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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
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

          {/* Select / Cancel toggle + Select All */}
          {captures.length > 0 && (
            <div className="flex items-center gap-3">
              {isSelectionMode && selectionType === 'captures' && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={visibleCaptures.length > 0 && selectedIds.length === visibleCaptures.length}
                    onCheckedChange={toggleSelectAllCaptures}
                  />
                  <span className="text-xs text-muted-foreground">All</span>
                </div>
              )}
              <button
                onClick={() => {
                  if (isSelectionMode && selectionType === 'captures') {
                    clearSelection()
                  } else {
                    clearSelection()
                    setIsSelectionMode(true)
                    setSelectionType('captures')
                  }
                }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSelectionMode && selectionType === 'captures' ? 'Cancel' : 'Select'}
              </button>
            </div>
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
                onPromote={() => handlePromoteToPage(capture.id)}
                onDelete={() => handleSingleDelete(capture.id)}
                onTogglePin={() => handleSinglePinToggle(capture.id)}
                isPromoting={promotingId === capture.id}
                isSelected={selectedIds.includes(capture.id)}
                onToggleSelect={() => toggleSelect(capture.id, 'capture')}
                isSelectionMode={isSelectionMode && selectionType === 'captures'}
                isDisabled={selectionType === 'pages'}
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
          <div className="flex items-center gap-3">
            {/* Select / Cancel for pages */}
            {filteredPages.length > 0 && (
              <div className="flex items-center gap-3">
                {isSelectionMode && selectionType === 'pages' && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={filteredPages.length > 0 && selectedIds.length === filteredPages.length}
                      onCheckedChange={toggleSelectAllPages}
                    />
                    <span className="text-xs text-muted-foreground">All</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (isSelectionMode && selectionType === 'pages') {
                      clearSelection()
                    } else {
                      clearSelection()
                      setIsSelectionMode(true)
                      setSelectionType('pages')
                    }
                  }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSelectionMode && selectionType === 'pages' ? 'Cancel' : 'Select'}
                </button>
              </div>
            )}
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
              <PageCard
                key={page.id}
                page={page}
                onSelect={onSelectPage}
                isSelected={selectedIds.includes(page.id)}
                onToggleSelect={() => toggleSelect(page.id, 'page')}
                isSelectionMode={isSelectionMode && selectionType === 'pages'}
                isDisabled={selectionType === 'captures'}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating Bulk Action Bar ──────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-3 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <div className="h-4 w-px bg-border" />

          {/* Delete */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="hover:text-destructive hover:border-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {bulkDeleting ? 'Deleting...' : 'Delete'}
          </Button>

          {/* Promote to Pages — only for captures */}
          {selectionType === 'captures' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkPromote}
              disabled={bulkPromoting}
            >
              <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
              {bulkPromoting ? 'Promoting...' : 'Make Pages'}
            </Button>
          )}

          {/* Pin / Unpin */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkPinToggle}
            disabled={bulkPinning}
          >
            <Pin className="mr-1.5 h-3.5 w-3.5" />
            {bulkPinning
              ? 'Updating...'
              : selectionType === 'captures'
                ? captures.filter(c => selectedIds.includes(c.id)).every(c => c.is_pinned)
                  ? 'Unpin'
                  : 'Pin'
                : 'Pin'}
          </Button>

          {/* Add Tags */}
          <Popover open={tagPopoverOpen} onOpenChange={(open) => {
            setTagPopoverOpen(open)
            if (!open) {
              setPendingTags([])
              setTagInput('')
            }
          }}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" disabled={bulkTagging}>
                <Tag className="mr-1.5 h-3.5 w-3.5" />
                {bulkTagging ? 'Tagging...' : 'Tags'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="center" side="top">
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Add tags to {selectedIds.length} {selectionType === 'pages' ? 'page' : 'capture'}{selectedIds.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <Input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Type a tag..."
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {pendingTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pendingTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                        #{tag}
                        <button
                          onClick={() => handleRemovePendingTag(tag)}
                          className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  className="w-full h-8"
                  onClick={handleApplyTags}
                  disabled={pendingTags.length === 0 || bulkTagging}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  {bulkTagging ? 'Applying...' : `Apply ${pendingTags.length} tag${pendingTags.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Move to Page */}
          <DropdownMenu onOpenChange={(open) => {
            if (open) handleFetchMovePages()
          }}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={bulkMoving}>
                <FolderInput className="mr-1.5 h-3.5 w-3.5" />
                {bulkMoving ? 'Moving...' : 'Move'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="w-64 max-h-64 overflow-y-auto">
              <DropdownMenuLabel>Move to page</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-muted-foreground"
                onClick={() => handleBulkMove(null)}
                disabled={bulkMoving}
              >
                Root level (no parent)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {movePagesLoading ? (
                <DropdownMenuItem disabled>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Loading pages...
                </DropdownMenuItem>
              ) : movePages.length === 0 ? (
                <DropdownMenuItem disabled>No pages available</DropdownMenuItem>
              ) : (
                movePages.map(page => (
                  <DropdownMenuItem
                    key={page.id}
                    onClick={() => handleBulkMove(page.id)}
                    disabled={bulkMoving || selectedIds.includes(page.id)}
                  >
                    <span className="mr-2">{page.icon || '📄'}</span>
                    <span className="truncate">{page.title}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-4 w-px bg-border" />

          {/* Cancel / Clear selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
