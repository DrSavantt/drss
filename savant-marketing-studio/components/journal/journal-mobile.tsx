'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Folder, 
  ChevronDown, 
  ChevronLeft,
  MessageCircle,
  Inbox,
  User,
  FolderKanban,
  FileText,
  Star
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { JournalFolder } from '@/app/actions/journal-folders'
import { JournalInputBar } from '@/components/journal-input-bar'
import { JournalFolderModal } from '@/components/journal-folder-modal'
import { JournalSearchModal } from '@/components/journal-search-modal'
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

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

interface Props {
  timeline: TimelineItem[]
  folders: JournalFolder[]
  selectedFolder: string | null
  onSelectFolder: (folderId: string | null) => void
  onCapture: () => void
  onFoldersChange: () => void
  totalCount: number
  clients?: Client[]
  projects?: Project[]
  defaultChatId?: string
  onEntryCreated?: () => void
}

// Group items by month
function groupByMonth(items: TimelineItem[]) {
  const groups: Record<string, TimelineItem[]> = {}
  
  items.forEach(item => {
    const date = new Date(item.updated_at || item.created_at)
    const monthKey = format(date, 'MMMM yyyy')
    
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(item)
  })
  
  return groups
}

export function JournalMobile({
  timeline,
  folders,
  selectedFolder,
  onSelectFolder,
  onCapture,
  onFoldersChange,
  totalCount,
  clients = [],
  projects = [],
  defaultChatId,
  onEntryCreated
}: Props) {
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null)
  const [folderSheetOpen, setFolderSheetOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const groupedItems = useMemo(() => groupByMonth(timeline), [timeline])
  
  const selectedFolderData = folders.find(f => f.id === selectedFolder)

  // Fetch entries when item is selected
  useEffect(() => {
    async function fetchEntries() {
      if (!selectedItem) {
        setEntries([])
        return
      }

      setIsLoading(true)
      try {
        const data = await getJournalEntries(selectedItem.id)
        setEntries(data || [])
      } catch (error) {
        console.error('Failed to fetch entries:', error)
        setEntries([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [selectedItem])

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

  // Item detail view
  if (selectedItem) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <button 
            onClick={() => setSelectedItem(null)}
            className="p-1 -ml-1 text-silver hover:text-foreground"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={getIconColor(selectedItem.type)}>
                {getIcon(selectedItem.type)}
              </div>
              <h1 className="text-lg font-semibold text-foreground truncate">
                {selectedItem.name || 'Untitled'}
              </h1>
            </div>
            <p className="text-xs text-silver">
              {selectedItem.entry_count} {selectedItem.entry_count === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <button 
            onClick={onCapture}
            className="p-2 text-red-primary"
          >
            <Plus className="w-5 h-5" />
          </button>
        </header>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto pb-24">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-red-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-silver">Loading...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-silver">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No entries yet</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {entries.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`p-4 bg-surface rounded-xl border border-border ${
                    entry.is_pinned ? 'ring-2 ring-warning/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {entry.is_pinned && (
                      <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    )}
                    <span className="text-xs text-silver">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {entry.content}
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
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

        {/* Bottom input */}
        <JournalInputBar 
          clients={clients}
          projects={projects}
          defaultChatId={defaultChatId || selectedItem?.id}
          onEntryCreated={onEntryCreated}
        />
      </div>
    )
  }

  // List view
  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Journal</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSearchOpen(true)}
            className="p-2 text-silver hover:text-foreground"
          >
            <Search className="w-5 h-5" />
          </button>
          <button 
            onClick={onCapture}
            className="p-2 text-red-primary"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {/* Folder button */}
      <button 
        onClick={() => setFolderSheetOpen(true)}
        className="flex items-center gap-2 px-4 py-3 border-b border-border hover:bg-surface-highlight transition-colors"
      >
        <Folder className="w-4 h-4 text-red-primary" />
        <span className="text-sm font-medium text-foreground">
          {selectedFolderData?.name || 'All Items'}
        </span>
        <span className="text-xs text-silver">({timeline.length})</span>
        <ChevronDown className="w-4 h-4 ml-auto text-silver" />
      </button>
      
      {/* Items list */}
      <div className="flex-1 overflow-y-auto pb-24">
        {timeline.length === 0 ? (
          <div className="p-8 text-center text-silver">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No captures yet</p>
            <p className="text-xs mt-1">Tap the + button to start</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([month, monthItems]) => (
            <div key={month}>
              <div className="px-4 py-2 bg-surface/50 sticky top-0 z-10">
                <span className="text-xs font-medium text-silver uppercase tracking-wider">{month}</span>
              </div>
              
              {monthItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full text-left px-4 py-3 border-b border-border/50 hover:bg-surface-highlight transition-colors active:bg-surface-highlight"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${getIconColor(item.type)}`}>
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {item.name || 'Untitled'}
                        </h3>
                        {item.entry_count > 0 && (
                          <span className="text-xs text-silver bg-surface-highlight px-1.5 py-0.5 rounded">
                            {item.entry_count}
                          </span>
                        )}
                      </div>
                      
                      {item.latest_entry?.content && (
                        <p className="text-xs text-silver line-clamp-2 mt-1">
                          {item.latest_entry.content}
                        </p>
                      )}
                      
                      {item.latest_entry?.tags && item.latest_entry.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {item.latest_entry.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs text-red-primary">#{tag}</span>
                          ))}
                        </div>
                      )}
                      
                      <span className="text-xs text-slate mt-1 block">
                        {formatDistanceToNow(new Date(item.updated_at || item.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
      
      {/* Bottom input bar */}
      <JournalInputBar 
        clients={clients}
        projects={projects}
        defaultChatId={defaultChatId}
        onEntryCreated={onEntryCreated}
      />
      
      {/* Modals */}
      <JournalFolderModal
        isOpen={folderSheetOpen}
        onClose={() => setFolderSheetOpen(false)}
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={(folderId) => {
          onSelectFolder(folderId)
          setFolderSheetOpen(false)
        }}
        totalCount={totalCount}
        onFoldersChange={onFoldersChange}
      />
      
      <JournalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={timeline}
        onItemClick={(id) => {
          const item = timeline.find(i => i.id === id)
          if (item) setSelectedItem(item)
          setSearchOpen(false)
        }}
      />
    </div>
  )
}

