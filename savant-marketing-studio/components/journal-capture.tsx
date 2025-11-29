'use client'

import { useState, useRef, useEffect } from 'react'
import { MentionModal } from './mention-modal'
import { ChatSelector } from './chat-selector'
import { createJournalEntry } from '@/app/actions/journal'
import { parseMentions } from '@/lib/utils/mentions'

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
  file_url?: string | null
  asset_type?: string
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
  content: Content[]
  chats: Chat[]
  defaultChatId: string
  onEntryCreated?: () => void
  onChatChange?: (chatId: string) => void
}

export function JournalCapture({ 
  clients, 
  projects,
  content: contentAssets,
  chats, 
  defaultChatId,
  onEntryCreated,
  onChatChange 
}: Props) {
  const [content, setContent] = useState('')
  const [selectedChatId, setSelectedChatId] = useState(defaultChatId)
  const [showMentionModal, setShowMentionModal] = useState(false)
  const [showChatSelector, setShowChatSelector] = useState(false)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const allMentionables = [
    ...clients.map(c => ({ id: c.id, name: c.name, type: 'client' as const })),
    ...projects.map(p => ({ id: p.id, name: p.name, type: 'project' as const })),
    ...contentAssets.map(c => ({ 
      id: c.id, 
      name: c.title, 
      type: 'content' as const,
      subType: c.file_url ? (c.asset_type || 'file') : 'note'
    }))
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

  // Clear success message after 2 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [success])

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setContent(value)
    setError(null)

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  function insertMention(item: { name: string }) {
    // Remove the @ that triggered the modal
    const newContent = content.slice(0, -1) + '@' + item.name + ' '
    setContent(newContent)
    setShowMentionModal(false)
    textareaRef.current?.focus()
  }

  function handleChatSelect(chatId: string) {
    setSelectedChatId(chatId)
    setShowChatSelector(false)
    onChatChange?.(chatId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)
    try {
      // Parse mentions and tags from content
      const { mentioned_clients, mentioned_projects, mentioned_content, tags } = parseMentions(
        content, 
        clients, 
        projects, 
        contentAssets
      )

      await createJournalEntry(
        content, 
        selectedChatId, 
        mentioned_clients, 
        mentioned_projects,
        mentioned_content,
        tags
      )
      setContent('')
      setSuccess(true)
      onEntryCreated?.()
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
        {/* Chat Selector Button */}
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

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind? Type @ to mention clients, # for tags..."
          className="w-full p-3 border border-mid-gray bg-dark-gray rounded-lg focus:ring-2 focus:ring-red-primary focus:border-transparent resize-none text-sm text-foreground placeholder-slate"
          rows={3}
        />

        {/* Error Message */}
        {error && (
          <p className="text-sm text-error mt-2">{error}</p>
        )}

        {/* Success Message */}
        {success && (
          <p className="text-sm text-success mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Entry captured!
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="p-2 hover:bg-dark-gray rounded-md transition-colors group opacity-50 cursor-not-allowed"
              title="Voice note (coming soon)"
              disabled
            >
              <span className="text-lg">🎤</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const rect = textareaRef.current?.getBoundingClientRect()
                if (rect) {
                  setMentionPosition({ top: rect.top + 80, left: rect.left + 20 })
                }
                setShowMentionModal(true)
              }}
              className="p-2 hover:bg-dark-gray rounded-md transition-colors flex items-center gap-1 text-xs text-silver hover:text-foreground"
              title="Insert mention"
            >
              <span className="text-base font-bold">@</span>
              <span className="hidden sm:inline">Mention</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setContent(prev => prev + '#')
                textareaRef.current?.focus()
              }}
              className="p-2 hover:bg-dark-gray rounded-md transition-colors flex items-center gap-1 text-xs text-silver hover:text-foreground"
              title="Add tag"
            >
              <span className="text-base font-bold">#</span>
              <span className="hidden sm:inline">Tag</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate hidden sm:inline">⌘+Enter to save</span>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-4 py-2 bg-red-primary text-foreground rounded-lg hover:bg-red-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Capture'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Mention Modal */}
      {showMentionModal && (
        <MentionModal
          items={allMentionables}
          onSelect={insertMention}
          onClose={() => setShowMentionModal(false)}
          position={mentionPosition}
        />
      )}

      {/* Chat Selector Modal */}
      {showChatSelector && (
        <ChatSelector
          chats={chats}
          selectedChatId={selectedChatId}
          onSelect={handleChatSelect}
          onClose={() => setShowChatSelector(false)}
        />
      )}
    </>
  )
}
