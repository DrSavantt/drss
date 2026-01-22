'use client'

import { createContentAsset, getClientProjects } from '@/app/actions/content'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useAIBarContext } from '@/hooks/useAIBarContext'

const TiptapEditor = dynamic(
  () => import('@/components/tiptap-editor').then(mod => ({ default: mod.TiptapEditor })),
  {
    loading: () => (
      <div className="min-h-[300px] flex items-center justify-center border border-border rounded-lg bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

export default function NewContentPage() {
  const params = useParams()
  const clientId = params.id as string

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [projectId, setProjectId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  
  // AI bar context (centralized fetch - ensures deleted items are filtered)
  const {
    clients: contextClients,
    projects: contextProjects,
    contentAssets: contextContent,
    journalEntries: contextJournal,
    writingFrameworks: contextFrameworks,
    models: aiModels,
  } = useAIBarContext()

  // Load projects for this specific client
  useEffect(() => {
    async function loadProjects() {
      const projectsData = await getClientProjects(clientId)
      setProjects(projectsData)
    }
    loadProjects()
  }, [clientId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    
    if (!content || content === '<p></p>') {
      setError('Content cannot be empty')
      return
    }
    
    setLoading(true)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('project_id', projectId)
    formData.append('content_json', content)

    try {
      const result = await createContentAsset(clientId, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // If successful, the server action will redirect
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-gray">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/dashboard/clients/${clientId}`}
            className="inline-flex items-center gap-2 text-sm text-silver hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Client
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-primary/10 border border-red-primary/30 text-red-primary px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title - Large inline input like Kortex */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            disabled={loading}
            className="w-full text-4xl font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 placeholder-silver/30 mb-6"
          />

          {/* Project selector - subtle */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs text-silver/60">Project:</span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={loading}
              className="text-xs bg-transparent border border-mid-gray/30 rounded px-2 py-1 text-silver focus:outline-none focus:border-mid-gray/60 transition-colors"
            >
              <option value="">None</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content Editor */}
          <div className="mb-8">
            <TiptapEditor
              content={content}
              onChange={(html) => setContent(html)}
              editable={!loading}
              clientId={clientId}
              models={aiModels}
              clients={contextClients}
              projects={contextProjects}
              contentAssets={contextContent}
              journalEntries={contextJournal}
              writingFrameworks={contextFrameworks}
            />
          </div>

          {/* Actions - Minimal */}
          <div className="flex items-center gap-3 pt-6 border-t border-mid-gray/30">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-red-primary text-white text-sm font-medium rounded-lg hover:bg-red-bright transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Note'}
            </button>
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="px-5 py-2 text-sm text-silver/70 hover:text-silver transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
