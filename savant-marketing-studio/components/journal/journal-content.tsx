'use client'

import { useState, useEffect } from 'react'
import { 
  MessageCircle, 
  FileText, 
  Inbox, 
  User, 
  FolderKanban,
  Edit,
  MoreVertical,
  Trash2,
  Star,
  FolderPlus
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { getJournalEntries } from '@/app/actions/journal'

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

interface Entry {
  id: string
  content: string
  tags: string[]
  created_at: string
  mentioned_clients: string[]
  chat_id: string
  is_pinned?: boolean
}

interface Props {
  item: TimelineItem | null
  onClose?: () => void
  onCapture: () => void
}

export function JournalContent({ item, onCapture }: Props) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Fetch entries when item changes
  useEffect(() => {
    async function fetchEntries() {
      if (!item) {
        setEntries([])
        return
      }

      setIsLoading(true)
      try {
        const data = await getJournalEntries(item.id)
        setEntries(data || [])
      } catch (error) {
        console.error('Failed to fetch entries:', error)
        setEntries([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [item])

  // Get icon based on type
  const getIcon = (type: string) => {
    switch (type) {
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

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-silver">
        <div className="text-center px-8">
          <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Select an item</h3>
          <p className="text-sm">Choose an item from the list to view its contents</p>
          <button
            onClick={onCapture}
            className="mt-6 px-6 py-2.5 bg-red-primary hover:bg-red-bright text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create New Capture
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={getIconColor(item.type)}>
            {getIcon(item.type)}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {item.name || 'Untitled'}
            </h1>
            <p className="text-xs text-silver">
              {format(new Date(item.created_at), 'MMM d, yyyy')} · {item.entry_count} {item.entry_count === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={onCapture}
            className="p-2 hover:bg-surface-highlight rounded-lg transition-colors text-silver hover:text-foreground"
            title="Add entry"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-surface-highlight rounded-lg transition-colors text-silver hover:text-foreground"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setMenuOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg z-50 py-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-highlight text-left text-sm transition-colors">
                    <Star className="w-4 h-4 text-warning" />
                    <span>Add to Favorites</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-highlight text-left text-sm transition-colors">
                    <FolderPlus className="w-4 h-4 text-silver" />
                    <span>Move to Folder</span>
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-error/10 text-left text-sm text-error transition-colors">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Content (scrollable) */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-red-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-silver">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-silver">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No entries yet</p>
            <p className="text-xs mt-1">Add your first entry to this item</p>
            <button
              onClick={onCapture}
              className="mt-4 px-4 py-2 bg-red-primary hover:bg-red-bright text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add Entry
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {entries.map((entry) => (
              <div 
                key={entry.id} 
                className={`p-4 bg-surface rounded-lg border border-border ${
                  entry.is_pinned ? 'ring-2 ring-warning/30' : ''
                }`}
              >
                {/* Entry header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {entry.is_pinned && (
                      <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    )}
                    <span className="text-xs text-silver">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                {/* Entry content */}
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {entry.content}
                </div>
                
                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                    {entry.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="text-xs text-red-primary bg-red-primary/10 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer input */}
      <div className="px-6 py-4 border-t border-border shrink-0">
        <button
          onClick={onCapture}
          className="w-full flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl hover:border-red-primary/50 transition-colors text-left"
        >
          <Edit className="w-4 h-4 text-red-primary flex-shrink-0" />
          <span className="text-silver text-sm">Add a new entry...</span>
        </button>
      </div>
    </div>
  )
}

