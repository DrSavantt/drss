'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, X, MessageCircle, FileText, Inbox, User, FolderKanban } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TimelineItem {
  id: string
  name: string
  type: 'inbox' | 'client' | 'project' | 'general'
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

interface JournalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  items: TimelineItem[]
  onItemClick: (itemId: string) => void
}

export function JournalSearchModal({ isOpen, onClose, items, onItemClick }: JournalSearchModalProps) {
  const [query, setQuery] = useState('')

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Reset query when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
    }
  }, [isOpen])

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) return []
    
    const q = query.toLowerCase()
    return items.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.latest_entry?.content.toLowerCase().includes(q) ||
      item.latest_entry?.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }, [items, query])

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

  // Format relative time
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  const handleItemClick = (itemId: string) => {
    onItemClick(itemId)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]
          transition-opacity duration-200 ease-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ willChange: 'opacity' }}
      />

      {/* Full screen search modal */}
      <div
        className={`fixed inset-0 z-[101] flex items-start justify-center p-4 md:pt-20
          transition-all duration-200 ease-out
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        style={{ willChange: 'opacity, transform' }}
      >
        <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Search input */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Search className="w-5 h-5 text-silver flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats and notes..."
              className="flex-1 bg-transparent outline-none text-foreground placeholder-slate"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="p-1 text-silver hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 text-silver hover:text-foreground transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {!query.trim() ? (
              <div className="flex flex-col items-center justify-center py-16 text-silver">
                <Search className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">Start typing to search</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-silver">
                <FileText className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">No results found for &quot;{query}&quot;</p>
              </div>
            ) : (
              <div className="p-2">
                <p className="px-3 py-2 text-xs text-silver">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
                {results.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className="w-full px-4 py-3 rounded-lg hover:bg-surface-highlight transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 ${getIconColor(item.type)}`}>
                        {getIcon(item.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate text-sm">
                          {item.name || 'Untitled'}
                        </h3>
                        
                        {/* Preview */}
                        {item.latest_entry?.content && (
                          <p className="text-xs text-silver truncate mt-1">
                            {item.latest_entry.content.substring(0, 100)}
                          </p>
                        )}
                        
                        {/* Tags */}
                        {item.latest_entry?.tags && item.latest_entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.latest_entry.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs text-red-primary">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <span className="text-xs text-slate mt-1 block">
                          {formatTime(item.updated_at || item.created_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

