'use client'

import { useMemo } from 'react'
import { MessageCircle, Inbox, User, FolderKanban, Clock, FileText, MoreVertical } from 'lucide-react'
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

  return (
    <div className="h-full border-r border-border/50 flex flex-col bg-[#0A0A0A]">
      {/* Header with shadow */}
      <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-b from-background to-background/50">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-foreground">
            {folderName || 'All Items'}
          </h2>
          <button className="p-1.5 hover:bg-surface/40 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-silver/60" />
          </button>
        </div>
        <p className="text-xs text-silver/60">
          {timeline.length || 0} items · Last updated today
        </p>
      </div>
      
      {/* Scrollable list with better spacing */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-primary border-t-transparent" />
          </div>
        ) : timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-surface/50 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-silver/30" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No items yet</h3>
            <p className="text-xs text-silver/60 max-w-[200px]">
              Start capturing your ideas and they'll appear here
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-6">
            {Object.entries(groupedItems).map(([month, monthItems]) => (
              <div key={month}>
                {/* Month header with gradient line */}
                <div className="relative mb-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 py-1 bg-[#0A0A0A] text-xs font-bold text-silver/50 uppercase tracking-wider">
                      {month}
                    </span>
                  </div>
                </div>
                
                {/* Items as cards */}
                <div className="space-y-2">
                  {monthItems.map((item) => (
                    <ItemCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      isSelected={selectedItem?.id === item.id && selectedItem?.type === item.type}
                      onClick={() => onSelectItem(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Polished item card
interface ItemCardProps {
  item: TimelineItem
  isSelected: boolean
  onClick: () => void
}

function ItemCard({ item, isSelected, onClick }: ItemCardProps) {
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
        return 'bg-red-primary/10 text-red-primary'
      case 'client':
        return 'bg-blue-500/10 text-blue-500'
      case 'project':
        return 'bg-amber-500/10 text-amber-500'
      default:
        return 'bg-surface-highlight text-silver/70'
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={`w-full text-left p-4 rounded-xl border transition-all group cursor-pointer ${
        isSelected
          ? 'bg-surface/80 border-red-primary/50 shadow-lg shadow-red-primary/10'
          : 'bg-surface/30 border-border/30 hover:bg-surface/50 hover:border-border/50 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon with background */}
        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconColor(item.type)}`}>
          {getIcon(item.type)}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-red-primary/90 transition-colors">
            {item.name || 'Untitled'}
          </h3>
          
          {/* Preview */}
          {item.latest_entry?.content && (
            <p className="text-xs text-silver/70 line-clamp-2 mb-2 leading-relaxed">
              {item.latest_entry.content.length > 100 
                ? item.latest_entry.content.substring(0, 100) + '...' 
                : item.latest_entry.content}
            </p>
          )}
          
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time */}
            <div className="flex items-center gap-1.5 text-[11px] text-silver/50">
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(item.updated_at || item.created_at)}</span>
            </div>
            
            {/* Entry count */}
            {item.entry_count > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-silver/50">
                <FileText className="w-3 h-3" />
                <span>{item.entry_count}</span>
              </div>
            )}
            
            {/* Tags */}
            {item.latest_entry?.tags && item.latest_entry.tags.slice(0, 2).map((tag: string) => (
              <span key={tag} className="px-2 py-0.5 bg-surface-highlight/50 text-[10px] font-medium text-silver/60 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
