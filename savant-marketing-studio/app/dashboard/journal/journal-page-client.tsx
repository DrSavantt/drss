'use client'

import { useState, useCallback, useMemo } from 'react'
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
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [currentChatId, setCurrentChatId] = useState(defaultChatId)
  const [isLoading, setIsLoading] = useState(false)
  
  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isBulkLoading, setIsBulkLoading] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  // Note editor modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteInitialData, setNoteInitialData] = useState<any>(null)

  // When chat changes, fetch new entries
  const handleChatChange = useCallback(async (chatId: string) => {
    setCurrentChatId(chatId)
    setIsLoading(true)
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
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

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
    formData.append('content_json', JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: data.content }] }] }))
    
    // Import createContentAsset dynamically
    const { createContentAsset } = await import('@/app/actions/content')
    await createContentAsset(data.clientId, formData)
    
    addToast('Note created successfully', 'success')
    // Router will redirect automatically after createContentAsset
  }, [addToast, router])

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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 hidden md:block">
        <JournalSidebar
          chats={chats}
          currentChatId={currentChatId}
          onChatSelect={handleChatChange}
          entryCounts={entryCounts}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 max-w-3xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Quick Capture Journal
              </h1>
              <p className="text-sm text-silver">
                Capture ideas instantly with @mentions and #tags
              </p>
            </div>
            <button
              onClick={() => {
                setNoteInitialData(null)
                setIsNoteModalOpen(true)
              }}
              className="flex-shrink-0 px-4 py-2 bg-red-primary text-white rounded-lg hover:bg-red-bright transition-colors font-medium flex items-center gap-2"
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
                <label className="flex items-center gap-2 cursor-pointer text-sm text-silver hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === entries.length && entries.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-mid-gray text-red-primary focus:ring-red-primary focus:ring-offset-charcoal"
                  />
                  Select All
                </label>
              )}
              <span className="text-sm text-slate">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>

          {/* Feed */}
          {isLoading ? (
            <div className="text-center py-12 bg-charcoal rounded-lg border border-mid-gray">
              <div className="animate-spin w-8 h-8 border-2 border-red-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-silver">Loading entries...</p>
            </div>
          ) : (
            <JournalFeed 
              entries={entries} 
              clients={clients}
              onEntryDeleted={handleEntryDeleted}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              onConvertToNote={handleConvertToNote}
            />
          )}
        </div>
      </div>

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
          setNoteInitialData(null)
        }}
        onSave={handleSaveNote}
        clients={clients}
        initialData={noteInitialData}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}
