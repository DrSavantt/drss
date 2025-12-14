'use client'

import { useState, useCallback, useMemo } from 'react'
import { Menu, X } from 'lucide-react'
import { useMobile } from '@/hooks/use-mobile'
import { JournalCapture } from '@/components/journal-capture'
import { JournalFeed } from '@/components/journal-feed'
import { JournalSidebar } from '@/components/journal-sidebar'
import { JournalBulkActionBar } from '@/app/components/journal-bulk-action-bar'
import { ConfirmationModal } from '@/app/components/confirmation-modal'
import { TagModal } from '@/app/components/tag-modal'
import { ToastContainer } from '@/app/components/toast'
import { NoteEditorModal } from '@/app/components/note-editor-modal'
import { 
  getJournalEntries,
  bulkDeleteJournalEntries,
  bulkPinJournalEntries,
  bulkUnpinJournalEntries,
  bulkAddTagsToJournalEntries
} from '@/app/actions/journal'

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
}

export function JournalPageClient({ 
  initialEntries, 
  chats, 
  clients, 
  projects,
  content,
  defaultChatId 
}: Props) {
  const isMobile = useMobile()
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [currentChatId, setCurrentChatId] = useState(defaultChatId)
  const [isLoading, setIsLoading] = useState(false)
  
  // Mobile sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
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
    setSidebarOpen(false) // Close drawer on mobile after selection
    try {
      const newEntries = await getJournalEntries(chatId)
      setEntries(newEntries || [])
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh entries after new entry is created
  const handleEntryCreated = useCallback(async () => {
    try {
      const newEntries = await getJournalEntries(currentChatId)
      setEntries(newEntries || [])
    } catch (error) {
      console.error('Failed to refresh entries:', error)
    }
  }, [currentChatId])

  // Remove entry from local state after delete
  const handleEntryDeleted = useCallback((deletedId: string) => {
    setEntries(prev => prev.filter(e => e.id !== deletedId))
  }, [])

  const currentChat = chats.find(c => c.id === currentChatId)

  // Calculate entry counts per chat for sidebar badges
  const entryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    chats.forEach(chat => {
      counts[chat.id] = 0
    })
    // This is simplified - in production you'd fetch actual counts from the server
    counts[currentChatId] = entries.length
    return counts
  }, [chats, currentChatId, entries.length])

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
      // Refresh entries to get updated tags
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
    // Pass HTML content directly - don't wrap in JSON structure
    formData.append('content_json', data.content)
    
    // Import createContentAsset dynamically
    const { createContentAsset } = await import('@/app/actions/content')
    await createContentAsset(data.clientId, formData)
    
    addToast('Note created successfully', 'success')
    // Router will redirect automatically after createContentAsset
  }, [addToast])

  const handleConvertToNote = useCallback((entry: Entry) => {
    // Extract title from first 50 chars of content
    const title = entry.content.substring(0, 50).replace(/@[^\s]+/g, '').trim()
    
    // Try to find mentioned client
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
    <div className="relative min-h-screen">
      {/* MOBILE: Overlay Drawer */}
      {isMobile && sidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Drawer Sidebar */}
          <aside className="fixed top-0 left-0 h-full w-80 bg-surface z-50 
            transform transition-transform duration-300 overflow-y-auto border-r border-border">
            <div className="p-4">
              {/* Close button */}
              <button 
                onClick={() => setSidebarOpen(false)}
                className="mb-4 p-2 rounded-lg hover:bg-surface-highlight transition-colors
                  flex items-center gap-2 text-foreground min-h-[44px]"
              >
                <X className="w-6 h-6" />
                <span className="text-sm font-medium">Close</span>
              </button>
              
              {/* Sidebar content */}
              <JournalSidebar
                chats={chats}
                currentChatId={currentChatId}
                onChatSelect={handleChatChange}
                entryCounts={entryCounts}
              />
            </div>
          </aside>
        </>
      )}

      {/* DESKTOP: Fixed Sidebar */}
      {!isMobile && (
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
      )}

      {/* MAIN CONTENT */}
      <main className={`
        transition-all duration-200 min-h-screen
        ${isMobile 
          ? 'w-full px-4 pt-4 pb-24' // Mobile: full width with bottom padding for nav
          : 'ml-64 px-8 pt-8 pb-8'   // Desktop: offset by sidebar
        }
      `}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Header */}
          <div className={`
            flex items-center gap-4
            ${isMobile ? 'flex-col' : 'flex-row justify-between'}
          `}>
            {/* Mobile: Menu button */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-full h-11 px-4 rounded-lg bg-surface hover:bg-surface-highlight
                  transition-colors flex items-center gap-2 border border-border"
              >
                <Menu className="w-5 h-5 text-foreground" />
                <span className="flex-1 text-left font-medium text-foreground">
                  {currentChat?.name || 'Inbox'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {entries.length}
                </span>
              </button>
            )}
            
            <div className={isMobile ? 'w-full text-center' : 'flex-1'}>
              <h1 className={`font-bold text-foreground mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
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
              className={`
                bg-red-primary hover:bg-red-bright text-white
                rounded-lg font-semibold transition-colors
                flex items-center gap-2 justify-center
                ${isMobile ? 'w-full h-11 px-4' : 'px-6 py-3 flex-shrink-0'}
              `}
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

          {/* Current Chat Indicator - Desktop only (mobile shows in header) */}
          {!isMobile && (
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
          )}
          
          {/* Mobile: Select All + Entry Count */}
          {isMobile && entries.length > 0 && (
            <div className="flex items-center justify-between bg-surface rounded-lg p-3 border border-border">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground min-h-[44px] items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === entries.length && entries.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-border text-red-primary focus:ring-red-primary focus:ring-offset-background"
                />
                Select All
              </label>
              <span className="text-sm text-muted-foreground">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          )}

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
