"use client"

import { useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react"
import { Users, FolderKanban, FileText, BookOpen, Layers, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContextItem, ContextItemType } from "./context-picker-modal"

interface InlineMentionPopupProps {
  query: string // text after @ symbol
  position: { top: number; left: number }
  selectedIndex: number
  onSelectedIndexChange: (index: number) => void
  onSelect: (item: ContextItem) => void
  onClose: () => void
  clients: Array<{ id: string; name: string }>
  projects: Array<{ id: string; name: string; clientName?: string | null }>
  contentAssets: Array<{ id: string; title: string; contentType?: string | null; clientName?: string | null }>
  journalEntries: Array<{
    id: string
    title: string | null
    content: string
    tags?: string[] | null
    mentionedClients?: Array<{ id: string; name: string }>
    mentionedProjects?: Array<{ id: string; name: string }>
    mentionedContent?: Array<{ id: string; name: string }>
  }>
  writingFrameworks: Array<{ id: string; name: string; category?: string }>
  // Optional: journal pages for Quick Capture and other use cases
  journalPages?: Array<{ id: string; title: string; icon?: string }>
}

export interface InlineMentionPopupRef {
  selectCurrent: () => void
}

const TYPE_CONFIG: Record<ContextItemType, { label: string; icon: typeof Users }> = {
  client: { label: "Clients", icon: Users },
  project: { label: "Projects", icon: FolderKanban },
  content: { label: "Content", icon: FileText },
  capture: { label: "Captures", icon: BookOpen },
  framework: { label: "Frameworks", icon: Layers },
  page: { label: "Pages", icon: StickyNote },
}

export const InlineMentionPopup = forwardRef<InlineMentionPopupRef, InlineMentionPopupProps>(({
  query,
  position,
  selectedIndex,
  onSelectedIndexChange,
  onSelect,
  onClose,
  clients,
  projects,
  contentAssets,
  journalEntries,
  writingFrameworks,
  journalPages = [],
}, ref) => {
  const popupRef = useRef<HTMLDivElement>(null)

  // Build unified list of all items
  const allItems = useMemo(() => {
    const items: ContextItem[] = []
    
    clients.forEach(c => items.push({ type: "client", id: c.id, name: c.name }))
    projects.forEach(p => items.push({ type: "project", id: p.id, name: p.name, subtitle: p.clientName || undefined }))
    contentAssets.forEach(c => items.push({ type: "content", id: c.id, name: c.title, subtitle: c.contentType || undefined }))
    journalEntries.forEach(j => items.push({ type: "capture", id: j.id, name: j.title || j.content.slice(0, 40) + "..." }))
    writingFrameworks.forEach(f => items.push({ type: "framework", id: f.id, name: f.name, subtitle: f.category }))
    journalPages.forEach(p => items.push({ type: "page", id: p.id, name: p.title, subtitle: p.icon || undefined }))
    
    return items
  }, [clients, projects, contentAssets, journalEntries, writingFrameworks, journalPages])

  // Filter based on query
  const filteredItems = useMemo(() => {
    if (!query) return allItems
    
    const lowerQuery = query.toLowerCase()
    
    // Check if query matches a type name
    const typeMatches: Record<string, ContextItemType> = {
      "client": "client",
      "clients": "client",
      "project": "project",
      "projects": "project",
      "content": "content",
      "capture": "capture",
      "captures": "capture",
      "journal": "capture",
      "framework": "framework",
      "frameworks": "framework",
      "page": "page",
      "pages": "page",
    }
    
    // If query matches a type name, show all of that type
    const matchedType = typeMatches[lowerQuery]
    if (matchedType) {
      return allItems.filter(item => item.type === matchedType)
    }
    
    // Otherwise filter by name/subtitle
    return allItems.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.subtitle?.toLowerCase().includes(lowerQuery)
    )
  }, [allItems, query])

  // Group filtered items by type
  const groupedItems = useMemo(() => {
    const groups: Record<ContextItemType, ContextItem[]> = {
      client: [],
      project: [],
      content: [],
      capture: [],
      framework: [],
      page: [],
    }
    
    filteredItems.forEach(item => {
      groups[item.type].push(item)
    })
    
    return groups
  }, [filteredItems])

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const list: ContextItem[] = []
    const order: ContextItemType[] = ["client", "project", "content", "capture", "framework", "page"]
    
    order.forEach(type => {
      list.push(...groupedItems[type])
    })
    
    return list
  }, [groupedItems])

  // Clamp selectedIndex to valid range when list changes
  useEffect(() => {
    if (flatList.length > 0 && selectedIndex >= flatList.length) {
      onSelectedIndexChange(flatList.length - 1)
    }
  }, [flatList.length, selectedIndex, onSelectedIndexChange])

  // Expose selectCurrent method to parent
  useImperativeHandle(ref, () => ({
    selectCurrent: () => {
      if (flatList.length > 0 && selectedIndex < flatList.length) {
        onSelect(flatList[selectedIndex])
      }
    }
  }), [flatList, selectedIndex, onSelect])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = popupRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    selectedElement?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  if (flatList.length === 0) {
    return (
      <div
        ref={popupRef}
        className="fixed z-[100] w-72 rounded-lg border border-border bg-popover p-3 shadow-lg"
        style={{ bottom: `calc(100vh - ${position.top}px)`, left: position.left }}
      >
        <p className="text-sm text-muted-foreground">No results for "{query}"</p>
      </div>
    )
  }

  // Track current index for keyboard navigation
  let currentIndex = 0

  return (
    <div
      ref={popupRef}
      className="fixed z-[100] w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
      style={{ 
        bottom: `calc(100vh - ${position.top}px)`, 
        left: position.left,
        maxHeight: "300px",
      }}
    >
      <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
        {(["client", "project", "content", "capture", "framework", "page"] as ContextItemType[]).map(type => {
          const items = groupedItems[type]
          if (items.length === 0) return null
          
          const { label, icon: Icon } = TYPE_CONFIG[type]
          
          return (
            <div key={type}>
              {/* Section header */}
              <div className="sticky top-0 flex items-center gap-2 bg-popover px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border/50">
                <Icon className="h-3 w-3" />
                {label}
              </div>
              
              {/* Items */}
              {items.map(item => {
                const itemIndex = currentIndex++
                const isSelected = itemIndex === selectedIndex
                
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    data-index={itemIndex}
                    onClick={() => onSelect(item)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                      isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    )}
                  >
                    <span className="truncate font-medium">{item.name}</span>
                    {item.subtitle && (
                      <span className="truncate text-xs text-muted-foreground">· {item.subtitle}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
})

InlineMentionPopup.displayName = "InlineMentionPopup"
