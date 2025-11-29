'use client'

import { useState, useCallback } from 'react'
import { JournalCapture } from '@/components/journal-capture'
import { JournalFeed } from '@/components/journal-feed'
import { getJournalEntries } from '@/app/actions/journal'

interface Entry {
  id: string
  content: string
  tags: string[]
  created_at: string
  mentioned_clients: string[]
  chat_id: string
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

interface Props {
  initialEntries: Entry[]
  chats: Chat[]
  clients: Client[]
  projects: Project[]
  defaultChatId: string
}

export function JournalPageClient({ 
  initialEntries, 
  chats, 
  clients, 
  projects, 
  defaultChatId 
}: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [currentChatId, setCurrentChatId] = useState(defaultChatId)
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Quick Capture Journal
        </h1>
        <p className="text-sm text-silver">
          Capture ideas instantly with @mentions and #tags
        </p>
      </div>

      {/* Capture Input */}
      <JournalCapture
        clients={clients}
        projects={projects}
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
        <span className="text-sm text-slate">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
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
        />
      )}
    </div>
  )
}
