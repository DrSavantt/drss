'use client'

import { MessageCircle, FileText, Inbox, User, FolderKanban } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface JournalTimelineItemProps {
  item: TimelineItem
  folderName?: string
  onClick: () => void
}

export function JournalTimelineItem({ item, folderName, onClick }: JournalTimelineItemProps) {
  // Get icon based on type
  const getIcon = () => {
    switch (item.type) {
      case 'inbox':
        return <Inbox className="w-5 h-5" />
      case 'client':
        return <User className="w-5 h-5" />
      case 'project':
        return <FolderKanban className="w-5 h-5" />
      default:
        return <MessageCircle className="w-5 h-5" />
    }
  }
  
  // Get icon color
  const getIconColor = () => {
    switch (item.type) {
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
  
  // Format relative time
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }
  
  // Get preview text from latest entry
  const getPreview = () => {
    if (!item.latest_entry?.content) return null
    const text = item.latest_entry.content
    return text.length > 80 ? text.substring(0, 80) + '...' : text
  }
  
  // Get tags from latest entry
  const getTags = () => {
    return item.latest_entry?.tags || []
  }

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 border-b border-border hover:bg-surface-highlight transition-colors text-left active:bg-surface-highlight"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 ${getIconColor()}`}>
          {getIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">
              {item.name || 'Untitled'}
            </h3>
            {item.entry_count > 0 && (
              <span className="text-xs text-silver bg-surface-highlight px-1.5 py-0.5 rounded">
                {item.entry_count}
              </span>
            )}
          </div>
          
          {/* Preview text */}
          {getPreview() && (
            <p className="text-sm text-silver mt-1 line-clamp-2">
              {getPreview()}
            </p>
          )}
          
          {/* Tags row */}
          {getTags().length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {getTags().slice(0, 3).map(tag => (
                <span 
                  key={tag} 
                  className="text-xs text-red-primary bg-red-primary/10 px-1.5 py-0.5 rounded"
                >
                  #{tag}
                </span>
              ))}
              {getTags().length > 3 && (
                <span className="text-xs text-silver">
                  +{getTags().length - 3} more
                </span>
              )}
            </div>
          )}
          
          {/* Timestamp and folder */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate">
              {formatTime(item.updated_at || item.created_at)}
            </span>
            {folderName && (
              <>
                <span className="text-xs text-slate">•</span>
                <span className="text-xs text-slate">{folderName}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Arrow indicator */}
        <span className="text-silver mt-1">→</span>
      </div>
    </button>
  )
}

