'use client'

import { useMemo } from 'react'
import { MessageCircle, Inbox, User, FolderKanban } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface TimelineItem {
  id: string
  name: string
  type: 'inbox' | 'client' | 'project' | 'general'
  linked_id?: string | null
  folder_id?: string | null
  created_at: string
  updated_at: string
  entry_count: number
  latest_entry?: {
    content: string
    tags: string[]
    created_at: string
  } | null
}

interface Props {
  timeline: TimelineItem[]
  selectedFolder?: string | null
  selectedItem: TimelineItem | null
  onSelectItem: (item: TimelineItem) => void
  folderName?: string
  isLoading?: boolean
}

// Group items by month
function groupByMonth(items: TimelineItem[]) {
  const groups: Record<string, TimelineItem[]> = {}
  
  items.forEach(item => {
    const date = new Date(item.updated_at || item.created_at)
    const monthKey = format(date, 'MMMM yyyy') // "December 2025"
    
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(item)
  })
  
  return groups
}

// Format relative time
function formatRelativeTime(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return 'Recently'
  }
}

export function JournalList({ 
  timeline, 
  selectedItem, 
  onSelectItem,
  folderName,
  isLoading
}: Props) {
  // Group by month
  const groupedItems = useMemo(() => {
    return groupByMonth(timeline)
  }, [timeline])

  // Get icon based on type
  const getIcon = (type: string) => {
    switch (type) {
      case 'inbox':
        return <Inbox className="w-4 h-4" />
      case 'client':
        return <User className="w-4 h-4" />
      case 'project':
        return <FolderKanban className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  // Get icon color
  const getIconColor = (type: string) => {
    switch (type) {
      case 'inbox':
        return 'text-red-primary'
      case 'client':
        return 'text-info'
      case 'project':
        return 'text-warning'
      default:
        return 'text-silver'
    }
  }

  return (
    <div className="h-full border-r border-border flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">
          {folderName || 'All Items'}
        </h2>
        <p className="text-xs text-silver mt-0.5">
          {timeline.length} {timeline.length === 1 ? 'item' : 'items'}
        </p>
      </div>
      
      {/* Items list (scrollable) */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-red-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-silver">Loading...</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="p-8 text-center text-silver">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No items yet</p>
            <p className="text-xs mt-1">Create your first capture to get started</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([month, monthItems]) => (
            <div key={month}>
              {/* Month header */}
              <div className="px-4 py-2 bg-surface/50 sticky top-0 z-10 border-b border-border/50">
                <span className="text-xs font-medium text-silver uppercase tracking-wider">{month}</span>
              </div>
              
              {/* Items in this month */}
              <div>
                {monthItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onSelectItem(item)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-surface-highlight transition-colors border-b border-border/50 cursor-pointer ${
                      selectedItem?.id === item.id 
                        ? 'bg-surface-highlight border-l-2 border-l-red-primary' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 ${getIconColor(item.type)}`}>
                        {getIcon(item.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {item.name || 'Untitled'}
                          </h3>
                          {item.entry_count > 0 && (
                            <span className="text-xs text-silver bg-surface-highlight px-1.5 py-0.5 rounded flex-shrink-0">
                              {item.entry_count}
                            </span>
                          )}
                        </div>
                        
                        {item.latest_entry?.content && (
                          <p className="text-xs text-silver line-clamp-2 mt-1">
                            {item.latest_entry.content.length > 80 
                              ? item.latest_entry.content.substring(0, 80) + '...' 
                              : item.latest_entry.content}
                          </p>
                        )}
                        
                        {/* Tags */}
                        {item.latest_entry?.tags && item.latest_entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.latest_entry.tags.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="text-xs text-red-primary">
                                #{tag}
                              </span>
                            ))}
                            {item.latest_entry.tags.length > 2 && (
                              <span className="text-xs text-silver">
                                +{item.latest_entry.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Time */}
                        <span className="text-xs text-slate mt-1.5 block">
                          {formatRelativeTime(item.updated_at || item.created_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

