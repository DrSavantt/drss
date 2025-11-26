'use client'

import { useState, useRef, useEffect } from 'react'
import { MentionModal } from './mention-modal'
import { ChatSelector } from './chat-selector'
import { createJournalEntry } from '@/app/actions/journal'

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

interface Chat {
  id: string
  name: string
  type: string
  linked_id?: string | null
}

interface Props {
  clients: Client[]
  projects: Project[]
  chats: Chat[]
  defaultChatId: string
}

export function JournalCapture({ clients, projects, chats, defaultChatId }: Props) {
  const [content, setContent] = useState('')
  const [selectedChatId, setSelectedChatId] = useState(defaultChatId)
  const [showMentionModal, setShowMentionModal] = useState(false)
  const [showChatSelector, setShowChatSelector] = useState(false)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const allMentionables = [
    ...clients.map(c => ({ id: c.id, name: c.name, type: 'client' as const })),
    ...projects.map(p => ({ id: p.id, name: p.name, type: 'project' as const }))
  ]

  // Handle ESC key to close modals
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowMentionModal(false)
        setShowChatSelector(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setContent(value)

    // Check for @ mention trigger
    const lastChar = value[value.length - 1]
    if (lastChar === '@') {
      // Get cursor position to show modal near it
      const rect = e.target.getBoundingClientRect()
      setMentionPosition({
        top: rect.top + 80,
        left: rect.left + 20
      })
      setShowMentionModal(true)
    }
  }

  function insertMention(item: { name: string }) {
    // Remove the @ that triggered the modal
    const newContent = content.slice(0, -1) + '@' + item.name + ' '
    setContent(newContent)
    setShowMentionModal(false)
    textareaRef.current?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)
    try {
      // Extract mentioned client/project IDs
      const mentionedClients: string[] = []
      const mentionedProjects: string[] = []
      
      allMentionables.forEach(item => {
        if (content.includes(`@${item.name}`)) {
          if (item.type === 'client') {
            mentionedClients.push(item.id)
          } else if (item.type === 'project') {
            mentionedProjects.push(item.id)
          }
        }
      })

      await createJournalEntry(content, selectedChatId, mentionedClients, [])
      setContent('')
    } catch (err) {
      console.error('Failed to save:', err)
      setError('Failed to save entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedChat = chats.find(c => c.id === selectedChatId)

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-charcoal rounded-lg border border-mid-gray p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setShowChatSelector(true)}
            className="text-sm text-silver hover:text-foreground hover:bg-dark-gray px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <span>
              {selectedChat?.type === 'inbox' && '📥'}
              {selectedChat?.type === 'client' && '👤'}
              {selectedChat?.type === 'project' && '📁'}
              {selectedChat?.type === 'general' && '💬'}
            </span>
            <span className="font-medium">{selectedChat?.name || 'Inbox'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          placeholder="Capture a quick note... Type @ to mention clients or projects"
          className="w-full p-3 border border-mid-gray bg-dark-gray rounded-lg focus:ring-2 focus:ring-red-primary focus:border-transparent resize-none text-sm text-foreground placeholder-slate"
          rows={3}
        />

        {error && (
          <p className="text-sm text-error mt-2">{error}</p>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="p-2 hover:bg-dark-gray rounded-md transition-colors group"
              title="Voice note (coming soon)"
              disabled
            >
              <span className="text-lg group-hover:scale-110 transition-transform inline-block">🎤</span>
            </button>
            <button
              type="button"
              onClick={() => setShowMentionModal(true)}
              className="p-2 hover:bg-dark-gray rounded-md transition-colors flex items-center gap-1 text-xs text-silver"
              title="Insert mention"
            >
              <span className="text-base">@</span>
              <span className="hidden sm:inline">Mention</span>
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-4 py-2 bg-red-primary text-foreground rounded-lg hover:bg-red-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {loading ? 'Saving...' : 'Capture'}
          </button>
        </div>
      </form>

      {showMentionModal && (
        <MentionModal
          items={allMentionables}
          onSelect={insertMention}
          onClose={() => setShowMentionModal(false)}
          position={mentionPosition}
        />
      )}

      {showChatSelector && (
        <ChatSelector
          chats={chats}
          selectedChatId={selectedChatId}
          onSelect={(id) => {
            setSelectedChatId(id)
            setShowChatSelector(false)
          }}
          onClose={() => setShowChatSelector(false)}
        />
      )}
    </>
  )
}
