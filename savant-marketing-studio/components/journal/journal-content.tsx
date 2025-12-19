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
  Star,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
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

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-surface/30 flex items-center justify-center">
            <Inbox className="w-12 h-12 text-silver/20" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Select an item</h2>
          <p className="text-sm text-silver/60 leading-relaxed">
            Choose an item from the list to view its contents and history
          </p>
        </div>
      </div>
    )
  }

  // Get icon based on type
  const getIcon = (type: string) => {
    switch (type) {
      case 'inbox':
        return <Inbox className="w-6 h-6" />
      case 'client':
        return <User className="w-6 h-6" />
      case 'project':
        return <FolderKanban className="w-6 h-6" />
      default:
        return <MessageCircle className="w-6 h-6" />
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
        return 'bg-surface/80 text-silver'
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Header with gradient */}
      <div className="px-8 py-5 border-b border-border/50 bg-gradient-to-b from-background to-background/50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconColor(item.type)}`}>
              {getIcon(item.type)}
            </div>
            
            {/* Title & meta */}
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">
                {item.name || 'Untitled'}
              </h1>
              <div className="flex items-center gap-3 text-xs text-silver/60">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(item.created_at), 'PPP')}</span>
                </div>
                <span>·</span>
                <span>{item.entry_count} {item.entry_count === 1 ? 'entry' : 'entries'}</span>
                {item.latest_entry?.tags && item.latest_entry.tags.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{item.latest_entry.tags.length} tags</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-surface/40 rounded-lg transition-colors">
              <Star className="w-4 h-4 text-silver/60" />
            </button>
            <button className="p-2 hover:bg-surface/40 rounded-lg transition-colors">
              <Edit className="w-4 h-4 text-silver/60" />
            </button>
            <button className="p-2 hover:bg-surface/40 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-silver/60" />
            </button>
          </div>
        </div>
        
        {/* Tags row */}
        {item.latest_entry?.tags && item.latest_entry.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {item.latest_entry.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-surface/50 border border-border/30 text-xs font-medium text-silver/70 rounded-lg">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-primary border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-surface/50 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-silver/30" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No entries yet</h3>
            <p className="text-xs text-silver/60">
              Start adding entries to this item
            </p>
          </div>
        ) : (
          <EntriesView entries={entries} itemType={item.type} />
        )}
      </div>
    </div>
  )
}

// Entries view component
interface EntriesViewProps {
  entries: Entry[]
  itemType: string
}

function EntriesView({ entries, itemType }: EntriesViewProps) {
  // Check if entries look like chat messages (have role-like structure)
  const isChat = entries.some(e => e.content.includes('User:') || e.content.includes('Assistant:'))

  if (isChat) {
    return <ChatView entries={entries} />
  }

  return <NoteView entries={entries} />
}

// Chat view component
function ChatView({ entries }: { entries: Entry[] }) {
  return (
    <div className="max-w-3xl space-y-4">
      {entries.map((entry, i) => {
        // Try to parse if it's a structured message
        const isUser = entry.content.includes('User:') || i % 2 === 0
        
        return (
          <div 
            key={entry.id}
            className={`p-5 rounded-xl border ${
              isUser
                ? 'bg-surface/50 border-border/30 ml-12'
                : 'bg-red-primary/5 border-red-primary/10 mr-12'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isUser
                  ? 'bg-surface-highlight text-foreground'
                  : 'bg-red-primary/20 text-red-primary'
              }`}>
                {isUser ? 'Y' : 'AI'}
              </div>
              <span className="text-xs font-semibold text-silver/70">
                {isUser ? 'You' : 'Assistant'}
              </span>
              <span className="text-xs text-silver/40">
                {format(new Date(entry.created_at), 'h:mm a')}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {entry.content.replace(/^(User:|Assistant:)\s*/, '')}
            </p>
            
            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {entry.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-surface-highlight/50 text-[10px] font-medium text-silver/60 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Note view component
function NoteView({ entries }: { entries: Entry[] }) {
  return (
    <div className="max-w-3xl space-y-6">
      {entries.map((entry) => (
        <div 
          key={entry.id}
          className="p-6 rounded-xl border border-border/30 bg-surface/30 hover:bg-surface/40 transition-colors"
        >
          {/* Entry header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
            <div className="flex items-center gap-2 text-xs text-silver/60">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(entry.created_at), 'PPP')}</span>
              <span>·</span>
              <span>{format(new Date(entry.created_at), 'h:mm a')}</span>
            </div>
            
            {entry.is_pinned && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <Star className="w-3 h-3 fill-amber-500" />
                <span>Pinned</span>
              </div>
            )}
          </div>
          
          {/* Entry content */}
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-foreground prose-headings:font-bold prose-headings:mb-2
            prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-3
            prose-a:text-red-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-semibold
            prose-code:text-red-primary/90 prose-code:bg-surface/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
            prose-ul:my-2 prose-ol:my-2
            prose-li:text-foreground/80 prose-li:my-1
          ">
            <p className="whitespace-pre-wrap">{entry.content}</p>
          </div>
          
          {/* Tags and mentions */}
          {((entry.tags && entry.tags.length > 0) || (entry.mentioned_clients && entry.mentioned_clients.length > 0)) && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20 flex-wrap">
              {entry.tags?.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-surface/50 border border-border/30 text-xs font-medium text-silver/70 rounded-lg">
                  #{tag}
                </span>
              ))}
              {entry.mentioned_clients?.map((client: string) => (
                <span key={client} className="px-3 py-1 bg-red-primary/10 border border-red-primary/20 text-xs font-medium text-red-primary/90 rounded-lg">
                  @{client}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
