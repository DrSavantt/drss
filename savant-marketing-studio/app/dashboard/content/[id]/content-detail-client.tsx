'use client'

import { useState, useEffect } from 'react'
import { updateContentAsset, deleteContentAsset, getClientProjects } from '@/app/actions/content'
import { getJournalEntriesByContent, getJournalEntriesByClient } from '@/app/actions/journal'
import { highlightMentions } from '@/lib/utils/mentions'
import { TiptapEditor } from '@/components/tiptap-editor'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getClientName } from '@/lib/supabase/types'

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
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loadingJournal, setLoadingJournal] = useState(false)

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
        // Get entries from content chat
        const contentEntries = await getJournalEntriesByContent(content.id)
        
        // Get entries mentioning the client
        const clientEntries = await getJournalEntriesByClient(content.client_id)
        
        // Combine and dedupe by id
        const allEntries = [...contentEntries, ...clientEntries]
        const uniqueEntries = Array.from(
          new Map(allEntries.map(entry => [entry.id, entry])).values()
        )
        
        // Sort by created_at descending
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
      // Tiptap stores as HTML string or JSON
      const htmlContent = typeof content.content_json === 'string' 
        ? content.content_json 
        : JSON.stringify(content.content_json)
      setEditorContent(htmlContent)
    }
  }, [content.content_json])

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    if (!editorContent || editorContent === '<p></p>') {
      setError('Content cannot be empty')
      setLoading(false)
      return
    }

    formData.append('content_json', JSON.stringify(editorContent))

    try {
      const result = await updateContentAsset(content.id, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else {
        setIsEditing(false)
        setLoading(false)
        router.refresh()
      }
    } catch {
      setError('Failed to update content')
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteContentAsset(content.id, content.client_id)
      router.push(`/dashboard/clients/${content.client_id}`)
    } catch {
      setError('Failed to delete content')
      setLoading(false)
    }
  }

  const typeColors = {
    note: 'bg-success/20 text-success',
    research_pdf: 'bg-info/20 text-info',
    ad_copy: 'bg-warning/20 text-warning',
    email: 'bg-info/20 text-info',
    blog_post: 'bg-red-primary/20 text-red-primary',
    landing_page: 'bg-warning/20 text-warning',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/dashboard/clients/${content.client_id}`}
          className="text-sm text-red-primary hover:text-red-bright no-underline"
        >
          ← Back to {content.clients?.name || 'Client'}
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-error/20 p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {!isEditing ? (
        // VIEW MODE
        <div className="space-y-6">
          <div className="bg-charcoal rounded-lg border border-mid-gray p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  {content.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      typeColors[content.asset_type as keyof typeof typeColors] || 'bg-dark-gray text-silver'
                    }`}
                  >
                    {content.asset_type.replace('_', ' ')}
                  </span>
                  {getClientName(content.clients) && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-info/20 text-info">
                      {getClientName(content.clients)}
                    </span>
                  )}
                  {content.projects && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-info/20 text-info">
                      {content.projects.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content Display */}
            <div className="prose prose-invert prose-lg max-w-none mb-6 mt-6">
              <div
                className="text-silver"
                dangerouslySetInnerHTML={{ __html: editorContent }}
              />
            </div>

            {/* Metadata */}
            <div className="border-t border-mid-gray pt-4 mt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-silver">Created:</span>
                  <span className="ml-2 text-slate">
                    {new Date(content.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-silver">Last Updated:</span>
                  <span className="ml-2 text-slate">
                    {new Date(content.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Journal Captures */}
            <div className="border-t border-mid-gray pt-6 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-silver flex items-center gap-2">
                  <span>📝</span> Quick Captures
                </h4>
                <Link
                  href="/dashboard/journal"
                  className="text-xs text-red-primary hover:text-red-bright transition-colors"
                >
                  View All →
                </Link>
              </div>
              
              {loadingJournal ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-red-primary border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : journalEntries.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {journalEntries.map(entry => (
                    <div key={entry.id} className="bg-dark-gray rounded-md p-3 text-sm">
                      <div 
                        className="text-foreground mb-1"
                        dangerouslySetInnerHTML={{ __html: highlightMentions(entry.content) }}
                      />
                      <div className="flex items-center gap-2 text-xs text-slate">
                        <span>
                          {new Date(entry.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex gap-1">
                            {entry.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-red-primary/20 text-red-primary rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-slate">
                  <p>No captures yet</p>
                  <Link
                    href="/dashboard/journal"
                    className="text-xs text-red-primary hover:text-red-bright mt-1 inline-block"
                  >
                    Create your first capture →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 rounded-md bg-red-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-red-bright transition-colors"
            >
              Edit Content
            </button>
            <button
              onClick={() => setIsDeleting(true)}
              className="rounded-md bg-error px-4 py-2 text-sm font-semibold text-foreground hover:bg-red-dark transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        // EDIT MODE
        <form action={handleSubmit} className="space-y-6">
          <div className="bg-charcoal rounded-lg border border-mid-gray p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-silver">
                Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                disabled={loading}
                defaultValue={content.title}
                className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground placeholder-slate shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-charcoal disabled:text-slate"
              />
            </div>

            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-silver">
                Link to Project (Optional)
              </label>
              <select
                name="project_id"
                id="project_id"
                disabled={loading}
                defaultValue={content.project_id || ''}
                className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-charcoal disabled:text-slate"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-silver mb-2">
                Content *
              </label>
              <TiptapEditor
                content={editorContent}
                onChange={(html) => setEditorContent(html)}
                editable={!loading}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-red-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-red-bright disabled:bg-mid-gray disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="rounded-md bg-dark-gray px-4 py-2 text-sm font-semibold text-silver hover:bg-mid-gray transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleting && (
        <div className="fixed inset-0 bg-pure-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-charcoal rounded-lg border border-mid-gray p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete {content.title}?
            </h3>
            <p className="text-sm text-silver mb-6">
              This will permanently delete this content. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-md bg-error px-4 py-2 text-sm font-semibold text-foreground hover:bg-red-dark disabled:bg-mid-gray transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                disabled={loading}
                className="flex-1 rounded-md bg-dark-gray px-4 py-2 text-sm font-semibold text-silver hover:bg-mid-gray transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
