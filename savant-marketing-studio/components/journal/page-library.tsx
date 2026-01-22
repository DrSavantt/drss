'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageCard, PageCardSkeleton, type PageCardData } from './page-card'
import { getRootPagesWithPreview, createQuickCapture } from '@/app/actions/journal-pages'
import { toast } from 'sonner'

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
// COMPONENT
// ============================================================================

export function PageLibrary({
  onSelectPage,
  onCreatePage,
  isCreating = false,
  className,
}: PageLibraryProps) {
  // State
  const [pages, setPages] = useState<PageCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Quick capture state
  const [captureContent, setCaptureContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Quick capture handler
  const handleQuickCapture = async () => {
    const content = captureContent.trim()
    if (!content || isSaving) return
    
    setIsSaving(true)
    try {
      const result = await createQuickCapture(content)
      setCaptureContent('')
      
      // Refresh pages list
      const rootPages = await getRootPagesWithPreview()
      setPages(rootPages)
      
      toast.success('Capture saved', {
        description: result.title,
        action: {
          label: 'Open',
          onClick: () => onSelectPage(result.id)
        }
      })
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

  // Fetch pages on mount
  useEffect(() => {
    async function fetchPages() {
      setLoading(true)
      setError(null)
      
      try {
        const rootPages = await getRootPagesWithPreview()
        setPages(rootPages)
      } catch (err) {
        console.error('Failed to fetch pages:', err)
        setError('Failed to load pages')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPages()
  }, [])

  // Filter pages by search query
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages
    
    const query = searchQuery.toLowerCase()
    return pages.filter(page => 
      page.title.toLowerCase().includes(query) ||
      (page.content_preview?.toLowerCase().includes(query))
    )
  }, [pages, searchQuery])

  // ============================================================================
  // RENDER: Loading State
  // ============================================================================

  if (loading) {
    return (
      <div className={className}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📓</span>
            <h2 className="text-2xl font-bold text-foreground">Your Pages</h2>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            New Page
          </Button>
        </div>

        {/* Search skeleton */}
        <div className="mb-6">
          <div className="h-10 w-full max-w-sm rounded-md bg-muted animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PageCardSkeleton key={i} />
          ))}
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
          <p className="text-muted-foreground mb-6">
            {error}
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER: Empty State (no pages created yet)
  // ============================================================================

  if (pages.length === 0) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">📓</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome to Journal
          </h2>
          <p className="text-muted-foreground mb-6">
            Create pages to organize your ideas, notes, and research.
            Pages can be nested to create a knowledge hierarchy.
          </p>
          <Button 
            onClick={onCreatePage}
            disabled={isCreating}
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Page
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER: Main Library View
  // ============================================================================

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📓</span>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Pages</h2>
            <p className="text-sm text-muted-foreground">
              {pages.length} root page{pages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button onClick={onCreatePage} disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </>
          )}
        </Button>
      </div>

      {/* Quick Capture Input */}
      <div className="mb-6">
        <div className="relative">
          <Textarea
            value={captureContent}
            onChange={(e) => setCaptureContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="✏️ Quick capture... (Enter to save, Shift+Enter for new line)"
            disabled={isSaving}
            className="min-h-[70px] max-h-[150px] resize-none pr-12"
            rows={2}
          />
          {isSaving && (
            <div className="absolute right-3 top-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {captureContent.length > 0 && !isSaving && (
            <div className="absolute right-3 top-3 text-xs text-muted-foreground">
              ↵
            </div>
          )}
        </div>
        {captureContent.length > 100 && (
          <div className="text-right text-xs text-muted-foreground mt-1">
            {captureContent.length} characters
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* No results state */}
      {filteredPages.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No pages found
          </h3>
          <p className="text-sm text-muted-foreground">
            No pages match "{searchQuery}"
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
