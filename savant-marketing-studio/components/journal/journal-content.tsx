'use client'

import type React from "react"
import { useState, useEffect, useRef, useCallback, useTransition } from "react"
import { Plus, Hash, Menu, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { PageTree } from "./page-tree"
import { PageView } from "./page-view"
import { PageLibrary } from "./page-library"
import { createPage, getPage } from "@/app/actions/journal-pages"
import { getAllTags, getPagesByTag } from "@/app/actions/journal-tags"

// ============================================================================
// TYPES
// ============================================================================

interface JournalContentProps {
  /** Initial page ID to display (from URL params) */
  initialPageId?: string | null
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JournalContent({ 
  initialPageId = null
}: JournalContentProps) {
  // Page selection state
  const [selectedPageId, setSelectedPageId] = useState<string | null>(initialPageId)
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Page tree refresh key
  const [treeKey, setTreeKey] = useState(0)
  
  // Transitions
  const [isPending, startTransition] = useTransition()
  
  // Tag filtering state
  const [allTags, setAllTags] = useState<string[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [filteredPageIds, setFilteredPageIds] = useState<string[] | null>(null)
  const [tagsLoading, setTagsLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  
  // Track mounted state
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  // Fetch all tags on mount
  useEffect(() => {
    async function fetchTags() {
      try {
        const tags = await getAllTags()
        if (isMountedRef.current) {
          setAllTags(tags)
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      } finally {
        if (isMountedRef.current) {
          setTagsLoading(false)
        }
      }
    }
    fetchTags()
  }, [treeKey]) // Re-fetch when tree refreshes (tags may have changed)
  
  // Handle tag click for filtering
  const handleTagClick = useCallback(async (tag: string) => {
    if (activeTag === tag) {
      // Toggle off - clear filter
      setActiveTag(null)
      setFilteredPageIds(null)
      return
    }
    
    setFilterLoading(true)
    setActiveTag(tag)
    
    try {
      const pageIds = await getPagesByTag(tag)
      if (isMountedRef.current) {
        setFilteredPageIds(pageIds)
      }
    } catch (error) {
      console.error('Failed to filter by tag:', error)
      setActiveTag(null)
      setFilteredPageIds(null)
    } finally {
      if (isMountedRef.current) {
        setFilterLoading(false)
      }
    }
  }, [activeTag])
  
  // Clear tag filter
  const handleClearFilter = useCallback(() => {
    setActiveTag(null)
    setFilteredPageIds(null)
  }, [])

  // Safety guard: if selectedPageId points to a capture, clear it
  // This prevents captures from ever rendering in PageView
  useEffect(() => {
    if (!selectedPageId) return

    let cancelled = false

    async function verifyPageType() {
      try {
        const page = await getPage(selectedPageId!)
        if (cancelled) return
        if (page && page.entry_type === 'capture') {
          console.warn('Safety guard: capture ID cannot render in PageView, clearing selection')
          setSelectedPageId(null)
        }
      } catch {
        // Let PageView handle fetch errors
      }
    }

    verifyPageType()

    return () => { cancelled = true }
  }, [selectedPageId])

  // Handle page selection
  const handleSelectPage = useCallback((pageId: string | null) => {
    setSelectedPageId(pageId)
    setSidebarOpen(false) // Close sidebar on mobile after selection
  }, [])

  // Handle tree refresh
  const handleTreeRefresh = useCallback(() => {
    setTreeKey(prev => prev + 1)
  }, [])

  // Create first page (for empty state)
  const handleCreateFirstPage = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await createPage('Getting Started')
        handleTreeRefresh()
        setSelectedPageId(result.id)
      } catch (error) {
        console.error('Failed to create page:', error)
      }
    })
  }, [handleTreeRefresh])

  // ============================================================================
  // SIDEBAR CONTENT
  // ============================================================================
  
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Page Tree */}
      <div className="flex-1 min-h-0">
        <PageTree
          key={treeKey}
          selectedPageId={selectedPageId}
          onSelectPage={handleSelectPage}
          onTreeRefresh={handleTreeRefresh}
          filteredPageIds={filteredPageIds}
        />
      </div>

      {/* Tags Section */}
      <div className="border-t border-border">
        <Card className="border-0 rounded-none bg-transparent">
          <CardHeader className="pb-2 px-3 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</CardTitle>
              {filterLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {/* Active filter indicator */}
            {activeTag && (
              <div className="mb-2">
                <button
                  onClick={handleClearFilter}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear filter: #{activeTag}
                </button>
              </div>
            )}
            
            <div className="flex flex-wrap gap-1.5">
              {tagsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading tags...
                </div>
              ) : allTags.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tags yet</p>
              ) : (
                allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    disabled={filterLoading}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
                      activeTag === tag
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
                      filterLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Hash className="h-3 w-3" />
                    {tag}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 lg:px-0 pb-4">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Journal</SheetTitle>
                <SheetDescription className="sr-only">Journal pages sidebar</SheetDescription>
              </SheetHeader>
              <div className="h-[calc(100vh-5rem)] overflow-hidden">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Title */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Journal</h1>
          <p className="text-sm text-muted-foreground">Organize your ideas, notes, and research</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 min-h-0 flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border border-border rounded-lg bg-card overflow-hidden">
          <SidebarContent />
        </aside>

        {/* Main Content Area */}
        <Card className="flex-1 min-w-0 overflow-hidden border-border bg-card">
          {selectedPageId ? (
            <PageView
              pageId={selectedPageId}
              onNavigate={handleSelectPage}
              onTreeRefresh={handleTreeRefresh}
            />
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <PageLibrary
                onSelectPage={handleSelectPage}
                onCreatePage={handleCreateFirstPage}
                isCreating={isPending}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
