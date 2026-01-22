'use client'

import { createContentAsset, getClientProjects } from '@/app/actions/content'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AIModel } from '@/components/editor/ai-prompt-bar'

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
  const [aiModels, setAiModels] = useState<AIModel[]>([])
  
  // Context data for @mentions in AI prompt bar
  const [contextClients, setContextClients] = useState<Array<{ id: string; name: string }>>([])
  const [contextProjects, setContextProjects] = useState<Array<{ id: string; name: string; clientName?: string | null }>>([])
  const [contextContent, setContextContent] = useState<Array<{ id: string; title: string; contentType?: string | null; clientName?: string | null }>>([])
  const [contextJournal, setContextJournal] = useState<Array<{ id: string; title: string | null; content: string; tags?: string[] | null }>>([])
  const [contextFrameworks, setContextFrameworks] = useState<Array<{ id: string; name: string; category?: string }>>([])

  useEffect(() => {
    async function loadData() {
      // Load projects for this client
      const projectsData = await getClientProjects(clientId)
      setProjects(projectsData)
      
      // Load AI models and context data for @mentions in parallel
      const supabase = createClient()
      const [
        modelsRes,
        clientsRes,
        allProjectsRes,
        contentRes,
        journalRes,
        frameworksRes
      ] = await Promise.all([
        supabase
          .from('ai_models')
          .select('id, model_name, display_name, max_tokens')
          .eq('is_active', true)
          .order('display_name'),
        supabase
          .from('clients')
          .select('id, name')
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('projects')
          .select('id, name, clients(name)')
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('content_assets')
          .select('id, title, asset_type, clients(name)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('journal_entries')
          .select('id, title, content, tags')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(100),
        supabase
          .from('marketing_frameworks')
          .select('id, name, category')
          .order('name'),
      ])

      if (modelsRes.data) setAiModels(modelsRes.data)
      if (clientsRes.data) setContextClients(clientsRes.data)
      if (allProjectsRes.data) {
        setContextProjects(allProjectsRes.data.map((p) => ({
          id: p.id,
          name: p.name,
          clientName: (p.clients as { name: string } | null)?.name || null
        })))
      }
      if (contentRes.data) {
        setContextContent(contentRes.data.map((c) => ({
          id: c.id,
          title: c.title,
          contentType: c.asset_type || null,
          clientName: (c.clients as { name: string } | null)?.name || null
        })))
      }
      if (journalRes.data) {
        setContextJournal(journalRes.data.map((j) => ({
          id: j.id,
          title: j.title,
          content: j.content || '',
          tags: j.tags
        })))
      }
      if (frameworksRes.data) setContextFrameworks(frameworksRes.data)
    }
    loadData()
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
