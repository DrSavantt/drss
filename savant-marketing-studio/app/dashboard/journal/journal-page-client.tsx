'use client'

import { useState, useCallback, useMemo } from 'react'
import { X } from 'lucide-react'
import { JournalCapture } from '@/components/journal-capture'
import { JournalBulkActionBar } from '@/app/components/journal-bulk-action-bar'
import { ConfirmationModal } from '@/app/components/confirmation-modal'
import { TagModal } from '@/app/components/tag-modal'
import { ToastContainer } from '@/app/components/toast'
import { NoteEditorModal } from '@/app/components/note-editor-modal'
import { JournalFolderModal } from '@/components/journal-folder-modal'
import { JournalSearchModal } from '@/components/journal-search-modal'
import { JournalSidebar, JournalList, JournalContent, JournalMobile } from '@/components/journal'
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
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [currentChatId, setCurrentChatId] = useState(defaultChatId)
  const [isLoading, setIsLoading] = useState(false)
  
  // Folder and timeline state
  const [folders, setFolders] = useState<JournalFolder[]>(initialFolders)
  const [timeline, setTimeline] = useState<TimelineItem[]>(initialTimeline)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  
  // Selected item for 3-column view
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null)
  
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
    setSelectedItem(null) // Clear selected item when changing folders
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

  // Handle item selection in 3-column view
  const handleSelectItem = useCallback((item: TimelineItem) => {
    setSelectedItem(item)
    setCurrentChatId(item.id)
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

  // Render both layouts - CSS will show/hide based on screen size
  return (
    <>
      {/* Mobile Layout - shown on screens < 1024px */}
      <div className="lg:hidden">
        <JournalMobile
          timeline={timeline}
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={handleFolderSelect}
          onCapture={() => setCaptureModalOpen(true)}
          onFoldersChange={handleFoldersChange}
          totalCount={initialCounts.totalChats}
          clients={clients}
          projects={projects}
          defaultChatId={defaultChatId}
          onEntryCreated={handleEntryCreated}
        />
      </div>

      {/* Desktop 3-column layout - shown on screens >= 1024px */}
      <div 
        className="hidden lg:flex overflow-hidden bg-background" 
        style={{ height: 'calc(100dvh - 3.5rem)' }}
      >
        {/* LEFT: Sidebar Navigation (256px fixed) */}
        <div className="w-64 flex-shrink-0 h-full">
          <JournalSidebar 
            selectedFolder={selectedFolder}
            onSelectFolder={handleFolderSelect}
            onCapture={() => setCaptureModalOpen(true)}
            onSearch={() => setSearchOpen(true)}
            folders={folders}
            totalCount={initialCounts.totalChats}
            onCreateFolder={() => setFolderModalOpen(true)}
          />
        </div>
        
        {/* MIDDLE: Items List (384px fixed) */}
        <div className="w-96 flex-shrink-0 h-full">
          <JournalList 
            timeline={timeline}
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            folderName={selectedFolderData?.name}
            isLoading={isLoading}
          />
        </div>
        
        {/* RIGHT: Content View (flex-1) */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <JournalContent 
            item={selectedItem}
            onCapture={() => setCaptureModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals - shared between mobile and desktop */}
      
      {/* Folder Modal */}
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
        onItemClick={(id) => {
          const item = timeline.find(i => i.id === id)
          if (item) handleSelectItem(item)
          setSearchOpen(false)
        }}
      />

      {/* Quick Capture Modal */}
      {captureModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setCaptureModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-surface border border-border shadow-xl rounded-xl w-full max-w-xl mx-4">
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

      {/* Delete Confirmation Modal */}
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

      {/* Tag Modal */}
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
    </>
  )
}
