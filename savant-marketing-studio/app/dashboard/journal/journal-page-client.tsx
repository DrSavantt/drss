'use client'

import { useState, useCallback, useMemo } from 'react'
import { Search, Folder, ChevronDown, X } from 'lucide-react'
import { useMobile } from '@/hooks/use-mobile'
import { JournalCapture } from '@/components/journal-capture'
import { JournalFeed } from '@/components/journal-feed'
import { JournalSidebar } from '@/components/journal-sidebar'
import { JournalBulkActionBar } from '@/app/components/journal-bulk-action-bar'
import { ConfirmationModal } from '@/app/components/confirmation-modal'
import { TagModal } from '@/app/components/tag-modal'
import { ToastContainer } from '@/app/components/toast'
import { NoteEditorModal } from '@/app/components/note-editor-modal'
import { JournalInputBar } from '@/components/journal-input-bar'
import { JournalTimelineItem } from '@/components/journal-timeline-item'
import { JournalFolderSheet } from '@/components/journal-folder-sheet'
import { 
  getJournalEntries,
  bulkDeleteJournalEntries,
  bulkPinJournalEntries,
  bulkUnpinJournalEntries,
  bulkAddTagsToJournalEntries
} from '@/app/actions/journal'
import { 
  JournalFolder, 
  getJournalFolders, 
  getUnifiedJournalTimeline 
} from '@/app/actions/journal-folders'

interface Entry {
  id: string
  content: string
  tags: string[]
  created_at: string
  mentioned_clients: string[]
  chat_id: string
  is_pinned?: boolean
}

interface Chat {
  id: string
  name: string
  type: string
  linked_id?: string | null
}

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

interface Content {
  id: string
  title: string
}

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

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface Props {
  initialEntries: Entry[]
  chats: Chat[]
  clients: Client[]
  projects: Project[]
  content: Content[]
  defaultChatId: string
  initialFolders?: JournalFolder[]
  initialTimeline?: TimelineItem[]
  initialCounts?: { totalChats: number; totalEntries: number }
}

export function JournalPageClient({ 
  initialEntries, 
  chats, 
  clients, 
  projects,
  content,
  defaultChatId,
  initialFolders = [],
  initialTimeline = [],
  initialCounts = { totalChats: 0, totalEntries: 0 }
}: Props) {
  const isMobile = useMobile()
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [currentChatId, setCurrentChatId] = useState(defaultChatId)
  const [isLoading, setIsLoading] = useState(false)
  
  // Mobile sidebar drawer state (for desktop fallback)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // New folder and timeline state
  const [folders, setFolders] = useState<JournalFolder[]>(initialFolders)
  const [timeline, setTimeline] = useState<TimelineItem[]>(initialTimeline)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [folderSheetOpen, setFolderSheetOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Quick capture modal state
  const [captureModalOpen, setCaptureModalOpen] = useState(false)
  
  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isBulkLoading, setIsBulkLoading] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  // Note editor modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteInitialData, setNoteInitialData] = useState<{
    title?: string
    content?: string
    clientId?: string
    projectId?: string
  } | undefined>(undefined)

  // When chat changes, fetch new entries
  const handleChatChange = useCallback(async (chatId: string) => {
    setCurrentChatId(chatId)
    setIsLoading(true)
    setSidebarOpen(false)
    setCaptureModalOpen(false)
    try {
      const newEntries = await getJournalEntries(chatId)
      setEntries(newEntries || [])
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle folder selection
  const handleFolderSelect = useCallback(async (folderId: string | null) => {
    setSelectedFolder(folderId)
    try {
      const newTimeline = await getUnifiedJournalTimeline(folderId)
      setTimeline(newTimeline)
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    }
  }, [])

  // Refresh folders
  const handleFoldersChange = useCallback(async () => {
    try {
      const newFolders = await getJournalFolders()
      setFolders(newFolders)
    } catch (error) {
      console.error('Failed to refresh folders:', error)
    }
  }, [])

  // Refresh entries after new entry is created
  const handleEntryCreated = useCallback(async () => {
    setCaptureModalOpen(false)
    try {
      const newEntries = await getJournalEntries(currentChatId)
      setEntries(newEntries || [])
      // Also refresh timeline
      const newTimeline = await getUnifiedJournalTimeline(selectedFolder)
      setTimeline(newTimeline)
    } catch (error) {
      console.error('Failed to refresh entries:', error)
    }
  }, [currentChatId, selectedFolder])

  // Remove entry from local state after delete
  const handleEntryDeleted = useCallback((deletedId: string) => {
    setEntries(prev => prev.filter(e => e.id !== deletedId))
  }, [])

  const currentChat = chats.find(c => c.id === currentChatId)
  const selectedFolderData = folders.find(f => f.id === selectedFolder)

  // Calculate entry counts per chat for sidebar badges
  const entryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    chats.forEach(chat => {
      counts[chat.id] = 0
    })
    counts[currentChatId] = entries.length
    return counts
  }, [chats, currentChatId, entries.length])

  // Filter timeline by search
  const filteredTimeline = useMemo(() => {
    if (!searchQuery.trim()) return timeline
    const query = searchQuery.toLowerCase()
    return timeline.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.latest_entry?.content.toLowerCase().includes(query) ||
      item.latest_entry?.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }, [timeline, searchQuery])

  // Toast helper
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }, [removeToast])

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(entries.map(entry => entry.id)))
    }
  }, [selectedIds.size, entries])

  const cancelSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Check if selection has pinned items
  const hasPinnedItems = useMemo(() => {
    return entries.some(entry => selectedIds.has(entry.id) && entry.is_pinned)
  }, [entries, selectedIds])

  // Bulk action handlers
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    setIsBulkLoading(true)
    try {
      await bulkDeleteJournalEntries(Array.from(selectedIds))
      setEntries(prev => prev.filter(e => !selectedIds.has(e.id)))
      setSelectedIds(new Set())
      setIsDeleteModalOpen(false)
      addToast(`Deleted ${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'}`, 'success')
    } catch (error) {
      console.error('Bulk delete error:', error)
      addToast('Failed to delete entries', 'error')
    } finally {
      setIsBulkLoading(false)
    }
  }, [selectedIds, addToast])

  const handleBulkPin = useCallback(async () => {
    if (selectedIds.size === 0) return
    setIsBulkLoading(true)
    try {
      await bulkPinJournalEntries(Array.from(selectedIds))
      setEntries(prev => prev.map(e => 
        selectedIds.has(e.id) ? { ...e, is_pinned: true } : e
      ))
      setSelectedIds(new Set())
      addToast(`Pinned ${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'}`, 'success')
    } catch (error) {
      console.error('Bulk pin error:', error)
      addToast('Failed to pin entries', 'error')
    } finally {
      setIsBulkLoading(false)
    }
  }, [selectedIds, addToast])

  const handleBulkUnpin = useCallback(async () => {
    if (selectedIds.size === 0) return
    setIsBulkLoading(true)
    try {
      await bulkUnpinJournalEntries(Array.from(selectedIds))
      setEntries(prev => prev.map(e => 
        selectedIds.has(e.id) ? { ...e, is_pinned: false } : e
      ))
      setSelectedIds(new Set())
      addToast(`Unpinned ${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'}`, 'success')
    } catch (error) {
      console.error('Bulk unpin error:', error)
      addToast('Failed to unpin entries', 'error')
    } finally {
      setIsBulkLoading(false)
    }
  }, [selectedIds, addToast])

  const handleBulkAddTags = useCallback(async (newTags: string[]) => {
    if (selectedIds.size === 0 || newTags.length === 0) return
    setIsBulkLoading(true)
    try {
      await bulkAddTagsToJournalEntries(Array.from(selectedIds), newTags)
      const newEntries = await getJournalEntries(currentChatId)
      setEntries(newEntries || [])
      setSelectedIds(new Set())
      addToast(`Added ${newTags.length} ${newTags.length === 1 ? 'tag' : 'tags'} to ${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'}`, 'success')
    } catch (error) {
      console.error('Bulk add tags error:', error)
      addToast('Failed to add tags', 'error')
    } finally {
      setIsBulkLoading(false)
    }
  }, [selectedIds, currentChatId, addToast])

  // Note editor handlers
  const handleSaveNote = useCallback(async (data: { title: string; clientId: string; projectId: string | null; content: string }) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('project_id', data.projectId || '')
    formData.append('content_json', data.content)
    
    const { createContentAsset } = await import('@/app/actions/content')
    await createContentAsset(data.clientId, formData)
    
    addToast('Note created successfully', 'success')
  }, [addToast])

  const handleConvertToNote = useCallback((entry: Entry) => {
    const title = entry.content.substring(0, 50).replace(/@[^\s]+/g, '').trim()
    const clientId = entry.mentioned_clients && entry.mentioned_clients.length > 0 
      ? entry.mentioned_clients[0] 
      : ''
    
    setNoteInitialData({
      title,
      content: entry.content,
      clientId,
      projectId: ''
    })
    setIsNoteModalOpen(true)
  }, [])

  // MOBILE VIEW - New Timeline Design
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-foreground">Journal</h1>
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-silver hover:text-foreground transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search bar (expandable) */}
          {searchOpen && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search captures..."
                  autoFocus
                  className="w-full bg-surface border border-border rounded-lg pl-10 pr-10 py-2.5 text-foreground placeholder-slate focus:border-red-primary focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Folder selector button */}
        <button
          onClick={() => setFolderSheetOpen(true)}
          className="flex items-center gap-2 px-4 py-3 border-b border-border hover:bg-surface-highlight transition-colors"
        >
          <Folder className="w-4 h-4 text-red-primary" />
          <span className="text-sm font-medium text-foreground">
            {selectedFolderData?.name || 'All Items'}
          </span>
          <span className="text-xs text-silver">
            ({filteredTimeline.length})
          </span>
          <ChevronDown className="w-4 h-4 ml-auto text-silver" />
        </button>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto pb-24">
          {filteredTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mb-4">
                <Folder className="w-8 h-8 text-silver" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No captures yet</h3>
              <p className="text-sm text-silver mb-4">
                Tap below to start capturing your thoughts
              </p>
            </div>
          ) : (
            filteredTimeline.map(item => (
              <JournalTimelineItem
                key={item.id}
                item={item}
                folderName={folders.find(f => f.id === item.folder_id)?.name}
                onClick={() => handleChatChange(item.id)}
              />
            ))
          )}
        </div>

        {/* Claude-style input bar */}
        <JournalInputBar onFocus={() => setCaptureModalOpen(true)} />

        {/* Folder bottom sheet */}
        <JournalFolderSheet
          isOpen={folderSheetOpen}
          onClose={() => setFolderSheetOpen(false)}
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={handleFolderSelect}
          totalCount={initialCounts.totalChats}
          onFoldersChange={handleFoldersChange}
        />

        {/* Quick Capture Modal */}
        {captureModalOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setCaptureModalOpen(false)}
            />
            <div className="fixed inset-x-4 top-1/4 z-[101] bg-surface border border-border rounded-2xl shadow-xl max-h-[60vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Quick Capture</h2>
                <button 
                  onClick={() => setCaptureModalOpen(false)}
                  className="p-1 text-silver hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <JournalCapture
                  clients={clients}
                  projects={projects}
                  content={content}
                  chats={chats}
                  defaultChatId={currentChatId}
                  onEntryCreated={handleEntryCreated}
                  onChatChange={handleChatChange}
                />
              </div>
            </div>
          </>
        )}

        {/* Note Editor Modal */}
        <NoteEditorModal
          isOpen={isNoteModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false)
            setNoteInitialData(undefined)
          }}
          onSave={handleSaveNote}
          clients={clients}
          initialData={noteInitialData}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    )
  }

  // DESKTOP VIEW - Keep existing layout
  return (
    <div className="relative min-h-screen">
      {/* DESKTOP: Fixed Sidebar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 
        bg-surface border-r border-border overflow-y-auto z-10">
        <div className="p-4">
          <JournalSidebar
            chats={chats}
            currentChatId={currentChatId}
            onChatSelect={handleChatChange}
            entryCounts={entryCounts}
          />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 px-8 pt-8 pb-8 transition-all duration-200 min-h-screen">
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Quick Capture Journal
              </h1>
              <p className="text-sm text-muted-foreground">
                Capture ideas instantly with @mentions and #tags
              </p>
            </div>
            
            <button
              onClick={() => {
                setNoteInitialData(undefined)
                setIsNoteModalOpen(true)
              }}
              className="bg-red-primary hover:bg-red-bright text-white
                rounded-lg font-semibold transition-colors
                flex items-center gap-2 justify-center px-6 py-3 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Note
            </button>
          </div>

          {/* Capture Input */}
          <JournalCapture
            clients={clients}
            projects={projects}
            content={content}
            chats={chats}
            defaultChatId={currentChatId}
            onEntryCreated={handleEntryCreated}
            onChatChange={handleChatChange}
          />

          {/* Current Chat Indicator */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span>
                {currentChat?.type === 'inbox' && '📥'}
                {currentChat?.type === 'client' && '👤'}
                {currentChat?.type === 'project' && '📁'}
                {currentChat?.type === 'general' && '💬'}
              </span>
              {currentChat?.name || 'Inbox'}
            </h2>
            <div className="flex items-center gap-3">
              {entries.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === entries.length && entries.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-border text-red-primary focus:ring-red-primary focus:ring-offset-background"
                  />
                  Select All
                </label>
              )}
              <span className="text-sm text-muted-foreground">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>

          {/* Feed */}
          {isLoading ? (
            <div className="text-center py-12 bg-surface rounded-lg border border-border">
              <div className="animate-spin w-8 h-8 border-2 border-red-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-muted-foreground">Loading entries...</p>
            </div>
          ) : (
            <JournalFeed 
              entries={entries} 
              clients={clients}
              projects={projects}
              content={content}
              onEntryDeleted={handleEntryDeleted}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              onConvertToNote={handleConvertToNote}
            />
          )}
        </div>
      </main>

      {/* Bulk Action Bar */}
      <JournalBulkActionBar
        selectedCount={selectedIds.size}
        onDelete={() => setIsDeleteModalOpen(true)}
        onPin={handleBulkPin}
        onUnpin={handleBulkUnpin}
        onAddTags={() => setIsTagModalOpen(true)}
        onCancel={cancelSelection}
        hasPinnedItems={hasPinnedItems}
      />

      {/* Modals */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Entries"
        message={`Are you sure you want to delete ${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isBulkLoading}
        isDanger
      />

      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onConfirm={handleBulkAddTags}
        title={`Add Tags to ${selectedIds.size} ${selectedIds.size === 1 ? 'Entry' : 'Entries'}`}
      />

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false)
          setNoteInitialData(undefined)
        }}
        onSave={handleSaveNote}
        clients={clients}
        initialData={noteInitialData}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
