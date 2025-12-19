'use client'

import { useState, useCallback, useMemo } from 'react'
import { Search, Folder, ChevronDown, X, Plus } from 'lucide-react'
import { useMobile } from '@/hooks/use-mobile'
import { JournalCapture } from '@/components/journal-capture'
import { JournalFeed } from '@/components/journal-feed'
import { JournalBulkActionBar } from '@/app/components/journal-bulk-action-bar'
import { ConfirmationModal } from '@/app/components/confirmation-modal'
import { TagModal } from '@/app/components/tag-modal'
import { ToastContainer } from '@/app/components/toast'
import { NoteEditorModal } from '@/app/components/note-editor-modal'
import { JournalInputBar } from '@/components/journal-input-bar'
import { JournalTimelineItem } from '@/components/journal-timeline-item'
import { JournalFolderModal } from '@/components/journal-folder-modal'
import { JournalSearchModal } from '@/components/journal-search-modal'
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
  
  // Folder and timeline state
  const [folders, setFolders] = useState<JournalFolder[]>(initialFolders)
  const [timeline, setTimeline] = useState<TimelineItem[]>(initialTimeline)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  
  // Modal states
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
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

  // Get selected folder name
  const selectedFolderData = folders.find(f => f.id === selectedFolder)

  // When chat changes, fetch new entries
  const handleChatChange = useCallback(async (chatId: string) => {
    setCurrentChatId(chatId)
    setIsLoading(true)
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Journal</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSearchOpen(true)}
              className="p-2 text-silver hover:text-foreground hover:bg-surface-highlight rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            {/* Desktop only: Quick capture button in header */}
            <button 
              onClick={() => setCaptureModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-primary hover:bg-red-bright text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Folder selector button */}
      <button
        onClick={() => setFolderModalOpen(true)}
        className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-border hover:bg-surface-highlight transition-colors"
      >
        <Folder className="w-4 h-4 text-red-primary" />
        <span className="text-sm md:text-base font-medium text-foreground">
          {selectedFolderData?.name || 'All Items'}
        </span>
        <span className="text-xs md:text-sm text-silver">
          ({timeline.length})
        </span>
        <ChevronDown className="w-4 h-4 ml-auto text-silver" />
      </button>

      {/* Timeline */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-24' : 'pb-8'}`}>
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-silver" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No captures yet</h3>
            <p className="text-sm text-silver mb-4">
              {isMobile ? 'Tap below to start capturing' : 'Click "New" to start capturing'}
            </p>
          </div>
        ) : (
          timeline.map(item => (
            <JournalTimelineItem
              key={item.id}
              item={item}
              folderName={folders.find(f => f.id === item.folder_id)?.name}
              onClick={() => handleChatChange(item.id)}
            />
          ))
        )}
      </div>

      {/* Mobile: Bottom input bar */}
      {isMobile && (
        <JournalInputBar onFocus={() => setCaptureModalOpen(true)} />
      )}

      {/* Folder Modal (desktop: centered, mobile: bottom sheet) */}
      <JournalFolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={handleFolderSelect}
        totalCount={initialCounts.totalChats}
        onFoldersChange={handleFoldersChange}
      />

      {/* Search Modal */}
      <JournalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={timeline}
        onItemClick={handleChatChange}
      />

      {/* Quick Capture Modal */}
      {captureModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setCaptureModalOpen(false)}
          />
          <div 
            className={`fixed z-[101] bg-surface border border-border shadow-xl ${
              isMobile 
                ? 'inset-x-4 top-1/4 rounded-2xl max-h-[60vh] overflow-hidden'
                : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl w-full max-w-xl'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Quick Capture</h2>
              <button 
                onClick={() => setCaptureModalOpen(false)}
                className="p-1 text-silver hover:text-foreground transition-colors"
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
