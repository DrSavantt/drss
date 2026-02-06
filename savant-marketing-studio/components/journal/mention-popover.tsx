"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, FolderKanban, FileText, BookOpen, Search } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

export interface MentionClient {
  id: string
  name: string
}

export interface MentionProject {
  id: string
  name: string
  client_id?: string
  clientName?: string
}

export interface MentionContent {
  id: string
  title: string
  clientName?: string
}

export interface MentionJournalPage {
  id: string
  title: string
  icon?: string
}

export interface MentionPopoverProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectClient: (client: MentionClient) => void
  onSelectProject: (project: MentionProject) => void
  onSelectContent: (content: MentionContent) => void
  onSelectJournalPage?: (page: MentionJournalPage) => void
  position?: { top: number; left: number }
  clients: MentionClient[]
  projects: MentionProject[]
  contentItems: MentionContent[]
  journalPages?: MentionJournalPage[]
  className?: string
  /** Max items to show per category. Default: 5 */
  maxItemsPerCategory?: number
  /** Show search input at top. Default: true */
  showSearchInput?: boolean
}

// =============================================================================
// Utility: Flattened item for keyboard navigation
// =============================================================================

type FlatItem =
  | { type: "client"; data: MentionClient }
  | { type: "project"; data: MentionProject }
  | { type: "content"; data: MentionContent }
  | { type: "page"; data: MentionJournalPage }

// =============================================================================
// Component
// =============================================================================

export function MentionPopover({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onSelectClient,
  onSelectProject,
  onSelectContent,
  onSelectJournalPage,
  position,
  clients,
  projects,
  contentItems,
  journalPages = [],
  className,
  maxItemsPerCategory = 5,
  showSearchInput = true,
}: MentionPopoverProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const popoverRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter items based on search query (case-insensitive)
  const search = searchQuery.toLowerCase()
  
  const filteredClients = clients
    .filter((c) => c.name.toLowerCase().includes(search))
    .slice(0, maxItemsPerCategory)

  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(search))
    .slice(0, maxItemsPerCategory)

  const filteredContent = contentItems
    .filter((c) => (c.title || "").toLowerCase().includes(search))
    .slice(0, maxItemsPerCategory)

  const filteredPages = journalPages
    .filter((p) => (p.title || "").toLowerCase().includes(search))
    .slice(0, maxItemsPerCategory)

  // Build flat list for keyboard navigation
  const flatItems: FlatItem[] = [
    ...filteredClients.map((c): FlatItem => ({ type: "client", data: c })),
    ...filteredProjects.map((p): FlatItem => ({ type: "project", data: p })),
    ...filteredContent.map((c): FlatItem => ({ type: "content", data: c })),
    ...filteredPages.map((p): FlatItem => ({ type: "page", data: p })),
  ]

  const hasResults = flatItems.length > 0

  // Reset selection when search changes or popover opens
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery, isOpen])

  // Auto-focus search input when popover opens
  useEffect(() => {
    if (isOpen && showSearchInput && searchInputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [isOpen, showSearchInput])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || !hasResults) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % flatItems.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length)
          break
        case "Enter":
          e.preventDefault()
          handleSelectItem(flatItems[selectedIndex])
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
        case "Tab":
          e.preventDefault()
          onClose()
          break
      }
    },
    [isOpen, hasResults, flatItems, selectedIndex, onClose]
  )

  // Handle item selection
  const handleSelectItem = useCallback(
    (item: FlatItem) => {
      switch (item.type) {
        case "client":
          onSelectClient(item.data)
          break
        case "project":
          onSelectProject(item.data)
          break
        case "content":
          onSelectContent(item.data)
          break
        case "page":
          if (onSelectJournalPage) {
            onSelectJournalPage(item.data)
          }
          break
      }
    },
    [onSelectClient, onSelectProject, onSelectContent, onSelectJournalPage]
  )

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  // Global keyboard listener for Escape
  useEffect(() => {
    if (!isOpen) return

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown)
    return () => document.removeEventListener("keydown", handleGlobalKeyDown)
  }, [isOpen, onClose])

  // Calculate current index offset for each section
  const getItemGlobalIndex = (type: FlatItem["type"], localIndex: number): number => {
    let offset = 0
    if (type === "project") offset = filteredClients.length
    if (type === "content") offset = filteredClients.length + filteredProjects.length
    if (type === "page") offset = filteredClients.length + filteredProjects.length + filteredContent.length
    return offset + localIndex
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "mention-popup z-50 min-w-[400px] bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl overflow-hidden",
            className
          )}
          style={
            position
              ? { top: position.top, left: position.left }
              : { bottom: "100%", left: 0, marginBottom: "0.5rem" }
          }
          role="listbox"
          aria-label="Mention suggestions"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input (optional) */}
          {showSearchInput && (
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  aria-label="Search mentions"
                />
              </div>
            </div>
          )}

          {/* Header (when no search input) */}
          {!showSearchInput && (
            <div className="px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">
                {searchQuery ? `Searching "${searchQuery}"` : "Link to..."}
              </span>
            </div>
          )}

          {/* Categories */}
          <div className="max-h-[360px] overflow-y-auto">
            {/* Clients Section */}
            {filteredClients.length > 0 && (
              <div role="group" aria-label="Clients">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 bg-muted/50 sticky top-0 border-b border-border/50">
                  <Users className="w-3.5 h-3.5" />
                  Clients
                </div>
                {filteredClients.map((client, idx) => {
                  const globalIdx = getItemGlobalIndex("client", idx)
                  return (
                    <button
                      key={client.id}
                      type="button"
                      role="option"
                      aria-selected={selectedIndex === globalIdx}
                      onClick={() => onSelectClient(client)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors",
                        selectedIndex === globalIdx
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/70"
                      )}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0" />
                      <span className="text-foreground truncate">{client.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Projects Section */}
            {filteredProjects.length > 0 && (
              <div role="group" aria-label="Projects">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 bg-muted/50 sticky top-0 border-b border-border/50">
                  <FolderKanban className="w-3.5 h-3.5" />
                  Projects
                </div>
                {filteredProjects.map((project, idx) => {
                  const globalIdx = getItemGlobalIndex("project", idx)
                  return (
                    <button
                      key={project.id}
                      type="button"
                      role="option"
                      aria-selected={selectedIndex === globalIdx}
                      onClick={() => onSelectProject(project)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors",
                        selectedIndex === globalIdx
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/70"
                      )}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-foreground truncate">{project.name}</span>
                        {project.clientName && (
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {project.clientName}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Content Section */}
            {filteredContent.length > 0 && (
              <div role="group" aria-label="Content">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 bg-muted/50 sticky top-0 border-b border-border/50">
                  <FileText className="w-3.5 h-3.5" />
                  Content
                </div>
                {filteredContent.map((content, idx) => {
                  const globalIdx = getItemGlobalIndex("content", idx)
                  return (
                    <button
                      key={content.id}
                      type="button"
                      role="option"
                      aria-selected={selectedIndex === globalIdx}
                      onClick={() => onSelectContent(content)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors",
                        selectedIndex === globalIdx
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/70"
                      )}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-foreground truncate">{content.title}</span>
                        {content.clientName && (
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {content.clientName}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Journal Pages Section */}
            {filteredPages.length > 0 && onSelectJournalPage && (
              <div role="group" aria-label="Journal Pages">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 bg-muted/50 sticky top-0 border-b border-border/50">
                  <BookOpen className="w-3.5 h-3.5" />
                  Pages
                </div>
                {filteredPages.map((page, idx) => {
                  const globalIdx = getItemGlobalIndex("page", idx)
                  return (
                    <button
                      key={page.id}
                      type="button"
                      role="option"
                      aria-selected={selectedIndex === globalIdx}
                      onClick={() => onSelectJournalPage(page)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors",
                        selectedIndex === globalIdx
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/70"
                      )}
                    >
                      {page.icon ? (
                        <span className="w-4 h-4 flex-shrink-0 text-center">{page.icon}</span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                      )}
                      <span className="text-foreground truncate">{page.title}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Empty State */}
          {!hasResults && searchQuery && (
            <div className="px-4 py-8 text-sm text-muted-foreground text-center">
              No matches found for "{searchQuery}"
            </div>
          )}

          {/* Empty State - No search */}
          {!hasResults && !searchQuery && (
            <div className="px-4 py-8 text-sm text-muted-foreground text-center">
              No items available
            </div>
          )}

          {/* Keyboard hints */}
          {hasResults && (
            <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">↵</kbd> select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">esc</kbd> close
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MentionPopover
