"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ArrowLeft, Search, Users, FolderKanban, FileText, 
  BookOpen, Layers, Check, X 
} from "lucide-react"
import { cn } from "@/lib/utils"

// Helper function to group items
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const key = keyFn(item) || "Other"
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

// Simplified context item type
export type ContextItemType = "client" | "project" | "content" | "capture" | "framework" | "page"

// Mention link type for captures
export interface MentionLink {
  type: 'client' | 'project' | 'content'
  id: string
  name: string
}

export interface ContextItem {
  type: ContextItemType
  id: string
  name: string
  subtitle?: string // e.g., client name for projects, content type for content
  // For captures - store mention links for grouping
  mentionLinks?: MentionLink[]
}

interface ContextPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (items: ContextItem[]) => void
  initialSearch?: string
  // Data sources (same as before)
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
}

const CATEGORIES = [
  { type: "client" as const, label: "Clients", icon: Users },
  { type: "project" as const, label: "Projects", icon: FolderKanban },
  { type: "content" as const, label: "Content", icon: FileText },
  { type: "capture" as const, label: "Captures", icon: BookOpen },
  { type: "framework" as const, label: "Frameworks", icon: Layers },
]

export function ContextPickerModal({
  open,
  onOpenChange,
  onSelect,
  initialSearch = "",
  clients,
  projects,
  contentAssets,
  journalEntries,
  writingFrameworks,
}: ContextPickerModalProps) {
  const [view, setView] = useState<"categories" | "items">("categories")
  const [activeCategory, setActiveCategory] = useState<ContextItemType | null>(null)
  const [search, setSearch] = useState(initialSearch)
  const [selectedItems, setSelectedItems] = useState<ContextItem[]>([])

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setView("categories")
      setActiveCategory(null)
      setSearch(initialSearch)
      setSelectedItems([])
    }
    onOpenChange(open)
  }

  // Transform data sources into unified ContextItem format
  const allItems = useMemo(() => {
    const items: ContextItem[] = []
    
    clients.forEach(c => items.push({ type: "client", id: c.id, name: c.name }))
    projects.forEach(p => items.push({ type: "project", id: p.id, name: p.name, subtitle: p.clientName || undefined }))
    contentAssets.forEach(c => items.push({ type: "content", id: c.id, name: c.title, subtitle: c.contentType || c.clientName || undefined }))
    
    // Build mention links for captures and create subtitle showing what they're linked to
    journalEntries.forEach(j => {
      const mentionLinks: MentionLink[] = []
      
      j.mentionedClients?.forEach(c => mentionLinks.push({ type: 'client', id: c.id, name: c.name }))
      j.mentionedProjects?.forEach(p => mentionLinks.push({ type: 'project', id: p.id, name: p.name }))
      j.mentionedContent?.forEach(c => mentionLinks.push({ type: 'content', id: c.id, name: c.name }))
      
      const subtitle = mentionLinks.length > 0 
        ? mentionLinks.map(l => l.name).join(', ')
        : undefined
      
      items.push({
        type: "capture",
        id: j.id,
        name: j.title || j.content.slice(0, 50) + "...",
        subtitle,
        mentionLinks: mentionLinks.length > 0 ? mentionLinks : undefined
      })
    })
    
    writingFrameworks.forEach(f => items.push({ type: "framework", id: f.id, name: f.name, subtitle: f.category }))
    
    return items
  }, [clients, projects, contentAssets, journalEntries, writingFrameworks])

  // Filter items based on search and active category
  const filteredItems = useMemo(() => {
    let items = allItems
    
    if (activeCategory) {
      items = items.filter(i => i.type === activeCategory)
    }
    
    if (search) {
      const lowerSearch = search.toLowerCase()
      items = items.filter(i => 
        i.name.toLowerCase().includes(lowerSearch) ||
        i.subtitle?.toLowerCase().includes(lowerSearch)
      )
    }
    
    return items
  }, [allItems, activeCategory, search])

  // Get counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<ContextItemType, number> = {
      client: clients.length,
      project: projects.length,
      content: contentAssets.length,
      capture: journalEntries.length,
      framework: writingFrameworks.length,
      page: 0, // Pages are referenced through inline mentions, not context picker
    }
    return counts
  }, [clients, projects, contentAssets, journalEntries, writingFrameworks])

  // Toggle item selection
  const toggleItem = (item: ContextItem) => {
    setSelectedItems(prev => {
      const exists = prev.some(i => i.id === item.id && i.type === item.type)
      if (exists) {
        return prev.filter(i => !(i.id === item.id && i.type === item.type))
      }
      return [...prev, item]
    })
  }

  const isSelected = (item: ContextItem) => 
    selectedItems.some(i => i.id === item.id && i.type === item.type)

  // Handle category click
  const handleCategoryClick = (type: ContextItemType) => {
    setActiveCategory(type)
    setView("items")
    setSearch("")
  }

  // Handle back navigation
  const handleBack = () => {
    setView("categories")
    setActiveCategory(null)
    setSearch("")
  }

  // Handle done
  const handleDone = () => {
    onSelect(selectedItems)
    handleOpenChange(false)
  }

  // Get icon color based on type
  const getTypeColor = (type: ContextItemType) => {
    switch (type) {
      case "client": return "text-primary"
      case "project": return "text-secondary-foreground"
      case "content": return "text-amber-600"
      case "capture": return "text-emerald-600"
      case "framework": return "text-orange-600"
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === "items" && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {view === "categories" ? "Add Context" : CATEGORIES.find(c => c.type === activeCategory)?.label}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={view === "categories" ? "Search everything..." : `Filter ${activeCategory}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selected count badge */}
        {selectedItems.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <span className="text-sm">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedItems([])}>
              Clear all
            </Button>
          </div>
        )}

        <ScrollArea className="h-[300px]">
          {view === "categories" && !search ? (
            // Categories view
            <div className="space-y-1">
              {CATEGORIES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", getTypeColor(type))} />
                    <span className="font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{categoryCounts[type]}</span>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Items view (or search results) - WITH GROUPING
            <div className="space-y-1">
              {filteredItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No results found</p>
              ) : (
                (() => {
                  // For captures, expand items that have multiple mentions (Option B)
                  // Each capture appears under each entity it mentions
                  type ExpandedItem = ContextItem & { _groupKey?: string }
                  let itemsToGroup: ExpandedItem[] = filteredItems
                  
                  if (activeCategory === "capture") {
                    itemsToGroup = []
                    filteredItems.forEach(item => {
                      if (item.mentionLinks && item.mentionLinks.length > 0) {
                        // Create an entry for each mention link
                        item.mentionLinks.forEach(link => {
                          const typeLabel = link.type === 'client' ? 'Clients' : 
                                           link.type === 'project' ? 'Projects' : 'Content'
                          itemsToGroup.push({
                            ...item,
                            _groupKey: `${typeLabel}: ${link.name}`
                          })
                        })
                      } else {
                        itemsToGroup.push({ ...item, _groupKey: 'Unlinked' })
                      }
                    })
                  }

                  // Group items based on active category
                  const getGroupKey = (item: ExpandedItem): string => {
                    // Use pre-computed group key for captures
                    if (activeCategory === "capture" && item._groupKey) {
                      return item._groupKey
                    }
                    if (activeCategory === "framework") {
                      return item.subtitle || "Other"
                    }
                    if (activeCategory === "content") {
                      return item.subtitle || "Other" // contentType is in subtitle
                    }
                    if (activeCategory === "project") {
                      return item.subtitle || "No Client" // clientName is in subtitle
                    }
                    if (activeCategory === "client") {
                      return "Clients" // No grouping for clients
                    }
                    // For search across all - group by type
                    if (!activeCategory) {
                      return CATEGORIES.find(c => c.type === item.type)?.label || "Other"
                    }
                    return "Items"
                  }

                  const grouped = groupBy(itemsToGroup, getGroupKey)
                  const sortedGroups = Object.keys(grouped).sort((a, b) => {
                    // Put "Other", "Untagged", "No Client", "Unlinked" at the end
                    const endGroups = ["Other", "Untagged", "No Client", "Unlinked"]
                    if (endGroups.includes(a)) return 1
                    if (endGroups.includes(b)) return -1
                    return a.localeCompare(b)
                  })

                  return sortedGroups.map(groupName => (
                    <div key={groupName}>
                      {/* Group header - only show if more than one group */}
                      {sortedGroups.length > 1 && (
                        <div className="sticky top-0 bg-background px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/50">
                          {groupName}
                        </div>
                      )}
                      
                      {/* Items in group */}
                      {grouped[groupName].map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => toggleItem(item)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                            isSelected(item) ? "bg-accent" : "hover:bg-accent/50"
                          )}
                        >
                          <div className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border",
                            isSelected(item) ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                          )}>
                            {isSelected(item) && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{item.name}</p>
                            {/* Only show subtitle if it's different from group name */}
                            {item.subtitle && item.subtitle !== groupName && sortedGroups.length > 1 && (
                              <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                            )}
                          </div>
                          {/* Show type badge when searching across all */}
                          {!activeCategory && (
                            <span className={cn("text-xs", getTypeColor(item.type))}>
                              {item.type}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))
                })()
              )}
            </div>
          )}
        </ScrollArea>

        {/* Done button */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDone} disabled={selectedItems.length === 0}>
            Add {selectedItems.length > 0 ? `(${selectedItems.length})` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
