'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Search,
  BookOpen,
  MessageSquare,
  FileText,
  BookMarked,
  BarChart3,
  Archive,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  href: string
  type: 'page' | 'client' | 'project' | 'content'
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PAGES: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, href: '/dashboard', type: 'page' },
  { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" />, href: '/dashboard/clients', type: 'page' },
  { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" />, href: '/dashboard/projects/board', type: 'page' },
  { id: 'research', label: 'Deep Research', icon: <Search className="w-4 h-4" />, href: '/dashboard/research', type: 'page' },
  { id: 'frameworks', label: 'Frameworks', icon: <BookOpen className="w-4 h-4" />, href: '/dashboard/frameworks', type: 'page' },
  { id: 'ai-chat', label: 'AI Chat', icon: <MessageSquare className="w-4 h-4" />, href: '/dashboard/ai/chat', type: 'page' },
  { id: 'content', label: 'Content', icon: <FileText className="w-4 h-4" />, href: '/dashboard/content', type: 'page' },
  { id: 'journal', label: 'Journal', icon: <BookMarked className="w-4 h-4" />, href: '/dashboard/journal', type: 'page' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, href: '/dashboard/analytics', type: 'page' },
  { id: 'archive', label: 'Archive', icon: <Archive className="w-4 h-4" />, href: '/dashboard/archive', type: 'page' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, href: '/dashboard/settings', type: 'page' },
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [items, setItems] = useState<CommandItem[]>([])
  const [clients, setClients] = useState<CommandItem[]>([])
  const [projects, setProjects] = useState<CommandItem[]>([])
  const [content, setContent] = useState<CommandItem[]>([])
  const [loading, setLoading] = useState(false)

  // Debounce the search query - only filter after user stops typing
  const debouncedQuery = useDebouncedValue(query, 200)

  // Fetch data when palette opens
  useEffect(() => {
    if (open && clients.length === 0) {
      fetchData()
    }
  }, [open])

  // Reset query and selection when opening
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch clients
      const clientsRes = await fetch('/api/clients')
      const clientsData = await clientsRes.json()
      const clientItems: CommandItem[] = clientsData.map((c: any) => ({
        id: `client-${c.id}`,
        label: c.name,
        description: c.email || c.industry,
        icon: <Users className="w-4 h-4" />,
        href: `/dashboard/clients/${c.id}`,
        type: 'client' as const
      }))
      setClients(clientItems)

      // Fetch projects
      const projectsRes = await fetch('/api/projects')
      const projectsData = await projectsRes.json()
      const projectItems: CommandItem[] = projectsData.slice(0, 20).map((p: any) => ({
        id: `project-${p.id}`,
        label: p.name,
        description: p.status,
        icon: <FolderKanban className="w-4 h-4" />,
        href: `/dashboard/clients/${p.client_id}?tab=projects`,
        type: 'project' as const
      }))
      setProjects(projectItems)

      // Fetch content
      const contentRes = await fetch('/api/content')
      const contentData = await contentRes.json()
      const contentItems: CommandItem[] = contentData.slice(0, 20).map((c: any) => ({
        id: `content-${c.id}`,
        label: c.title,
        description: c.asset_type,
        icon: <FileText className="w-4 h-4" />,
        href: `/dashboard/content/${c.id}`,
        type: 'content' as const
      }))
      setContent(contentItems)
    } catch (error) {
      console.error('Failed to fetch command palette data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter items based on debounced query (not raw query)
  useEffect(() => {
    const allItems = [...PAGES, ...clients, ...projects, ...content]
    
    if (!debouncedQuery.trim()) {
      setItems(allItems)
    } else {
      const filtered = allItems.filter(item =>
        item.label.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
      setItems(filtered)
    }
    
    setSelectedIndex(0) // Reset selection when filter changes
  }, [debouncedQuery, clients, projects, content])

  // Group items by type
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const groups = [
    { key: 'page', label: 'Pages', items: groupedItems.page || [] },
    { key: 'client', label: 'Clients', items: groupedItems.client || [] },
    { key: 'project', label: 'Projects', items: groupedItems.project || [] },
    { key: 'content', label: 'Content', items: groupedItems.content || [] },
  ].filter(g => g.items.length > 0)

  const handleSelect = (item: CommandItem) => {
    router.push(item.href)
    onOpenChange(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[selectedIndex]) {
        handleSelect(items[selectedIndex])
      }
    }
  }

  let currentIndex = 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl max-h-[600px] overflow-hidden" aria-describedby={undefined}>
        {/* Accessible title for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Search Command Palette</DialogTitle>
        </VisuallyHidden>
        
        {/* Search Input */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, clients, projects, content..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[500px]">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-2">
              {groups.map((group) => (
                <div key={group.key} className="mb-4 last:mb-0">
                  {/* Group Header */}
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.label}
                  </div>
                  
                  {/* Group Items */}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const index = currentIndex++
                      const isSelected = index === selectedIndex
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                            isSelected
                              ? 'bg-accent text-foreground'
                              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                          )}
                        >
                          <div className={cn(
                            'flex-shrink-0',
                            isSelected && 'text-red-500'
                          )}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {item.label}
                            </div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">
                              ↵
                            </kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border border-border">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border border-border">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border border-border">ESC</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
