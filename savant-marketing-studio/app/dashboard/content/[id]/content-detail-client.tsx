'use client'

import { useState, useEffect, useRef } from 'react'
import { updateContentAsset, deleteContentAsset, getClientProjects } from '@/app/actions/content'
import { getJournalEntriesByContent, getJournalEntriesByClient } from '@/app/actions/journal'
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState(content.project_id || '')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loadingJournal, setLoadingJournal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProjects() {
      const data = await getClientProjects(content.client_id)
      setProjects(data)
    }
    loadProjects()
  }, [content.client_id])

  // Fetch journal entries
  useEffect(() => {
    async function fetchJournalEntries() {
      setLoadingJournal(true)
      try {
        const contentEntries = await getJournalEntriesByContent(content.id)
        const clientEntries = await getJournalEntriesByClient(content.client_id)
        
        const allEntries = [...contentEntries, ...clientEntries]
        const uniqueEntries = Array.from(
          new Map(allEntries.map(entry => [entry.id, entry])).values()
        )
        
        uniqueEntries.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        setJournalEntries(uniqueEntries)
      } catch (error) {
        console.error('Failed to load journal entries:', error)
      } finally {
        setLoadingJournal(false)
      }
    }
    fetchJournalEntries()
  }, [content.id, content.client_id])

  // Initialize editor content from JSON
  useEffect(() => {
    if (content.content_json) {
      const htmlContent = typeof content.content_json === 'string' 
        ? content.content_json 
        : JSON.stringify(content.content_json)
      setEditorContent(htmlContent)
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
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Back Navigation */}
        <Link
          href={`/dashboard/clients/${content.client_id}`}
          className="inline-flex items-center gap-2 text-sm text-silver hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {content.clients?.name || 'Client'}
        </Link>

        {/* Error Message */}
        {error && (
          <div className="bg-red-primary/20 border border-red-primary text-red-primary px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Title - Editable inline */}
        <div>
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
              className="w-full text-4xl font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 p-0"
            />
          ) : (
            <h1
              onClick={() => !loading && setIsEditingTitle(true)}
              className="text-4xl font-bold text-foreground cursor-text hover:text-foreground/80 transition-colors"
            >
              {title}
            </h1>
          )}
        </div>

        {/* Metadata Row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Asset Type Badge */}
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-success/20 text-success border border-success/30">
              {content.asset_type.replace('_', ' ')}
            </span>

            {/* Client Badge */}
            {content.clients && (
              <Link
                href={`/dashboard/clients/${content.client_id}`}
                className="px-3 py-1 text-xs font-medium rounded-full bg-info/20 text-info border border-info/30 hover:bg-info/30 transition-colors"
              >
                {content.clients.name}
              </Link>
            )}

            {/* Project Badge */}
            {content.projects && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-warning/20 text-warning border border-warning/30">
                {content.projects.name}
              </span>
            )}

            {/* Dates */}
            <span className="text-xs text-slate">
              Created: {new Date(content.created_at).toLocaleDateString()}
              {' • '}
              Updated: {new Date(content.updated_at).toLocaleDateString()}
            </span>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-silver hover:text-foreground hover:bg-charcoal rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-charcoal border border-mid-gray rounded-lg shadow-xl z-10">
                <button
                  onClick={() => {
                    setIsEditingContent(!isEditingContent)
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-dark-gray transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {isEditingContent ? 'Stop Editing' : 'Edit Content'}
                </button>
                <button
                  onClick={() => {
                    handleDelete()
                    setShowMenu(false)
                  }}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 text-sm text-red-primary hover:bg-dark-gray transition-colors flex items-center gap-2 border-t border-mid-gray disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-mid-gray" />

        {/* Content Area - Notion-like */}
        <div className="bg-charcoal rounded-xl border border-mid-gray p-8">
          <TiptapEditor
            content={editorContent}
            onChange={setEditorContent}
            editable={isEditingContent}
          />

          {isEditingContent && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-mid-gray">
              <button
                onClick={handleSaveContent}
                disabled={loading}
                className="px-6 py-2 bg-red-primary text-white rounded-lg hover:bg-red-bright transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditingContent(false)
                  // Reset content to original
                  if (content.content_json) {
                    const htmlContent = typeof content.content_json === 'string' 
                      ? content.content_json 
                      : JSON.stringify(content.content_json)
                    setEditorContent(htmlContent)
                  }
                }}
                disabled={loading}
                className="px-6 py-2 border border-mid-gray text-silver hover:text-foreground hover:bg-dark-gray rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <hr className="border-mid-gray" />

        {/* Quick Captures - Collapsible */}
        <div className="bg-charcoal rounded-xl border border-mid-gray p-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📝</span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Quick Captures</h3>
                <p className="text-xs text-silver">
                  {loadingJournal ? 'Loading...' : `${journalEntries.length} ${journalEntries.length === 1 ? 'entry' : 'entries'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/journal"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-red-primary hover:text-red-bright font-medium transition-colors"
              >
                View All →
              </Link>
              <svg
                className={`w-5 h-5 text-silver transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isExpanded && (
            <div className="mt-6">
              {loadingJournal ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-red-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : journalEntries.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-mid-gray rounded-lg">
                  <span className="text-4xl mb-3 block">📭</span>
                  <h3 className="text-base font-medium text-foreground mb-2">No captures yet</h3>
                  <p className="text-sm text-silver mb-4">
                    Create a journal capture mentioning @{content.title} to see it here
                  </p>
                  <Link
                    href="/dashboard/journal"
                    className="inline-block bg-red-primary text-pure-white px-4 py-2 rounded-lg hover:bg-red-bright transition-all duration-200 text-sm font-medium"
                  >
                    Create Capture
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {journalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-mid-gray rounded-lg p-4 hover:border-red-bright/50 transition-all duration-200"
                    >
                      <div
                        className="text-sm text-foreground mb-3 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlightMentions(entry.content) }}
                      />
                      <div className="flex items-center justify-between text-xs text-slate">
                        <div className="flex items-center gap-3">
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
                                  className="px-2 py-0.5 bg-red-primary/20 text-red-primary rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click outside menu to close */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
