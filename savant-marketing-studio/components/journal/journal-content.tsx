'use client'

import type React from "react"
import { useState, useEffect, useRef, useCallback, useTransition } from "react"
import { Plus, Hash, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { PageTree } from "./page-tree"
import { PageView } from "./page-view"
import { PageLibrary } from "./page-library"
import { createPage } from "@/app/actions/journal-pages"

// ============================================================================
// TYPES
// ============================================================================

interface JournalContentProps {
  /** Initial page ID to display (from URL params) */
  initialPageId?: string | null
}

// All available tags for filtering
const allTags = ["AIDA", "PAS", "voice", "ideas", "research", "followup"]

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
  
  // Track mounted state
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

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
        />
      </div>

      {/* Tags Section */}
      <div className="border-t border-border">
        <Card className="border-0 rounded-none bg-transparent">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Hash className="h-3 w-3" />
                  {tag}
                </button>
              ))}
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
