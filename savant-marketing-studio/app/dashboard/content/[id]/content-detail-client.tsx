'use client'

import { useState, useEffect, useRef } from 'react'
import { updateContentAsset, deleteContentAsset } from '@/app/actions/content'
import { getJournalEntriesByContent } from '@/app/actions/journal'
import { highlightMentions } from '@/lib/utils/mentions'
import { TiptapEditor } from '@/components/tiptap-editor'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Content {
  id: string
  title: string
  content_json: string | Record<string, unknown>
  asset_type: string
  created_at: string
  updated_at: string
  client_id: string
  project_id: string | null
  clients: {
    name: string
  } | null
  projects: {
    name: string
  } | null
}

interface JournalEntry {
  id: string
  content: string
  tags: string[]
  created_at: string
}

interface ContentDetailClientProps {
  content: Content
}

export function ContentDetailClient({ content }: ContentDetailClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(content.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState<string | object>('')
  const [selectedProjectId] = useState(content.project_id || '')
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loadingJournal, setLoadingJournal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)


  // Fetch journal entries - ONLY captures that @mention this specific content
  useEffect(() => {
    async function fetchJournalEntries() {
      setLoadingJournal(true)
      try {
        // Only get captures that specifically @mention this content
        const contentEntries = await getJournalEntriesByContent(content.id)
        
        // Sort by newest first
        contentEntries.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        setJournalEntries(contentEntries)
      } catch (error) {
        console.error('Failed to load journal entries:', error)
      } finally {
        setLoadingJournal(false)
      }
    }
    fetchJournalEntries()
  }, [content.id])

  // Initialize editor content - handles both HTML string and Tiptap JSON
  useEffect(() => {
    if (content.content_json) {
      // Pass directly - Tiptap editor handles both HTML string and JSON object
      setEditorContent(content.content_json)
    }
  }, [content.content_json])

  // Focus title input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  async function handleSaveTitle() {
    if (!title.trim()) {
      setError('Title cannot be empty')
      setTitle(content.title)
      setIsEditingTitle(false)
      return
    }

    if (title === content.title) {
      setIsEditingTitle(false)
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('project_id', selectedProjectId)
    formData.append('content_json', JSON.stringify(editorContent))

    try {
      const result = await updateContentAsset(content.id, formData)
      if (result?.error) {
        setError(result.error)
        setTitle(content.title)
      } else {
        router.refresh()
      }
    } catch {
      setError('Failed to update title')
      setTitle(content.title)
    } finally {
      setLoading(false)
      setIsEditingTitle(false)
    }
  }

  async function handleSaveContent() {
    if (!editorContent || editorContent === '<p></p>') {
      setError('Content cannot be empty')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('project_id', selectedProjectId)
    formData.append('content_json', JSON.stringify(editorContent))

    try {
      const result = await updateContentAsset(content.id, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsEditingContent(false)
        router.refresh()
      }
    } catch {
      setError('Failed to update content')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      await deleteContentAsset(content.id, content.client_id)
      router.push(`/dashboard/clients/${content.client_id}`)
    } catch {
      setError('Failed to delete content')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-gray">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header Row - Back Navigation and Actions Menu */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/dashboard/clients/${content.client_id}`}
            className="inline-flex items-center gap-2 text-sm text-silver hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {content.clients?.name || 'Client'}
          </Link>

          {/* Delete Button - Simple trash icon */}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1.5 text-silver/40 hover:text-red-primary transition-colors disabled:opacity-50"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-primary/20 border border-red-primary text-red-primary px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Title with Dropdown Arrow - Kortex Style */}
        <div className="flex items-center gap-3 mb-4">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle()
                if (e.key === 'Escape') {
                  setTitle(content.title)
                  setIsEditingTitle(false)
                }
              }}
              disabled={loading}
              className="flex-1 text-4xl font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 p-0"
            />
          ) : (
            <h1
              onClick={() => !loading && setIsEditingTitle(true)}
              className="flex-1 text-4xl font-bold text-foreground cursor-text hover:text-foreground/80 transition-colors"
            >
              {title}
            </h1>
          )}
          
          {/* Dropdown Arrow for Captures */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-silver/60 hover:text-silver transition-colors rounded"
            aria-label="Toggle captures"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Collapsible Captures Panel - Kortex Style */}
        {isExpanded && (
          <div className="mb-6 bg-charcoal/50 border border-mid-gray/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-silver">
                Captures ({journalEntries.length})
              </h3>
              <Link
                href="/dashboard/journal"
                className="text-xs text-silver/60 hover:text-silver transition-colors"
              >
                View All →
              </Link>
            </div>

            {loadingJournal ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-3 border-red-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : journalEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-silver/60 mb-2">No captures yet</p>
                <p className="text-xs text-silver/40">
                  Mention @{content.title} in journal to see captures here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {journalEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-dark-gray/50 rounded border border-mid-gray/30 hover:border-mid-gray/60 transition-colors"
                  >
                    <div
                      className="text-sm text-foreground/90 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: highlightMentions(entry.content) }}
                    />
                    <div className="flex items-center gap-3 mt-2 text-xs text-silver/60">
                      <span>
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-1">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-red-primary/20 text-red-primary/80 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metadata Row - Subtle */}
        <div className="flex items-center gap-2 flex-wrap mb-8 text-xs">
          {/* Asset Type Badge */}
          <span className="px-2 py-1 rounded bg-success/10 text-success/80 border border-success/20">
            {content.asset_type.replace('_', ' ')}
          </span>

          {/* Client Badge */}
          {content.clients && (
            <Link
              href={`/dashboard/clients/${content.client_id}`}
              className="px-2 py-1 rounded bg-info/10 text-info/80 border border-info/20 hover:bg-info/20 transition-colors"
            >
              {content.clients.name}
            </Link>
          )}

          {/* Project Badge */}
          {content.projects && (
            <span className="px-2 py-1 rounded bg-warning/10 text-warning/80 border border-warning/20">
              {content.projects.name}
            </span>
          )}

          {/* Dates */}
          <span className="text-silver/50">
            Created {new Date(content.created_at).toLocaleDateString()} • Updated {new Date(content.updated_at).toLocaleDateString()}
          </span>
        </div>

        {/* Content Area - Click to Edit (like Notion/Kortex) */}
        <div 
          onClick={() => !isEditingContent && !loading && setIsEditingContent(true)}
          className={`min-h-[400px] rounded-lg transition-colors ${
            !isEditingContent 
              ? 'cursor-text hover:bg-charcoal/20' 
              : ''
          }`}
        >
          <TiptapEditor
            content={editorContent}
            onChange={setEditorContent}
            editable={isEditingContent}
          />

          {isEditingContent && (
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-mid-gray/30">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSaveContent()
                }}
                disabled={loading}
                className="px-6 py-2 bg-red-primary text-white rounded-lg hover:bg-red-bright transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingContent(false)
                  // Reset content to original
                  if (content.content_json) {
                    setEditorContent(content.content_json)
                  }
                }}
                disabled={loading}
                className="px-6 py-2 border border-mid-gray/50 text-silver hover:text-foreground hover:border-mid-gray rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
