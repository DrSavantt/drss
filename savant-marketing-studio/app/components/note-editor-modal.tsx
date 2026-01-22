'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { getClientProjects } from '@/app/actions/content'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { AnimatedButton } from '@/components/animated-button'
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

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

interface InitialData {
  title?: string
  content?: string
  clientId?: string
  projectId?: string
}

interface NoteEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { title: string; clientId: string; projectId: string | null; content: string }) => Promise<void>
  clients: Client[]
  initialData?: InitialData
}

export function NoteEditorModal({ 
  isOpen, 
  onClose, 
  onSave, 
  clients,
  initialData 
}: NoteEditorModalProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || '')
  const [selectedProjectId, setSelectedProjectId] = useState(initialData?.projectId || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiModels, setAiModels] = useState<AIModel[]>([])
  
  // Context data for @mentions in AI prompt bar
  const [contextClients, setContextClients] = useState<Array<{ id: string; name: string }>>([])
  const [contextProjects, setContextProjects] = useState<Array<{ id: string; name: string; clientName?: string | null }>>([])
  const [contextContent, setContextContent] = useState<Array<{ id: string; title: string; contentType?: string | null; clientName?: string | null }>>([])
  const [contextJournal, setContextJournal] = useState<Array<{ id: string; title: string | null; content: string; tags?: string[] | null }>>([])
  const [contextFrameworks, setContextFrameworks] = useState<Array<{ id: string; name: string; category?: string }>>([])

  // Fetch AI models and context data for @mentions on mount
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      // Fetch all data in parallel
      const [
        modelsRes,
        clientsRes,
        projectsRes,
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
      if (projectsRes.data) {
        setContextProjects(projectsRes.data.map((p: { id: string; name: string; clients?: { name: string } | null }) => ({
          id: p.id,
          name: p.name,
          clientName: p.clients?.name || null
        })))
      }
      if (contentRes.data) {
        setContextContent(contentRes.data.map((c: { id: string; title: string; asset_type?: string | null; clients?: { name: string } | null }) => ({
          id: c.id,
          title: c.title,
          contentType: c.asset_type || null,
          clientName: c.clients?.name || null
        })))
      }
      if (journalRes.data) {
        setContextJournal(journalRes.data.map((j: { id: string; title: string | null; content: string | null; tags?: string[] | null }) => ({
          id: j.id,
          title: j.title,
          content: j.content || '',
          tags: j.tags
        })))
      }
      if (frameworksRes.data) setContextFrameworks(frameworksRes.data)
    }

    fetchData()
  }, [])

  useEffect(() => {
    async function loadProjects() {
      if (selectedClientId) {
        const data = await getClientProjects(selectedClientId)
        setProjects(data)
      } else {
        setProjects([])
        setSelectedProjectId('')
      }
    }
    loadProjects()
  }, [selectedClientId])

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setContent(initialData.content || '')
      setSelectedClientId(initialData.clientId || '')
      setSelectedProjectId(initialData.projectId || '')
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!selectedClientId) {
      setError('Please select a client')
      return
    }

    if (!content.trim() || content === '<p></p>') {
      setError('Content is required')
      return
    }

    setLoading(true)
    try {
      await onSave({
        title: title.trim(),
        clientId: selectedClientId,
        projectId: selectedProjectId || null,
        content
      })
      setTitle('')
      setContent('')
      setSelectedClientId('')
      setSelectedProjectId('')
      onClose()
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save note. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setTitle('')
      setContent('')
      setSelectedClientId('')
      setSelectedProjectId('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val) handleClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Note</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Create a new note with title, client, project and content</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[70vh]">
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {error && (
              <div className="bg-red-primary/10 border border-red-primary/30 text-red-primary px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-xs font-medium text-silver/70 mb-1.5">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                disabled={loading}
                className="w-full px-3 py-2.5 bg-charcoal/50 border border-mid-gray/30 rounded-lg text-foreground placeholder-silver/40 focus:outline-none focus:border-mid-gray/60 transition-colors disabled:opacity-50 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="client" className="block text-xs font-medium text-silver/70 mb-1.5">
                  Client
                </label>
                <select
                  id="client"
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value)
                    setSelectedProjectId('')
                  }}
                  disabled={loading}
                  className="w-full px-3 py-2.5 bg-charcoal/50 border border-mid-gray/30 rounded-lg text-foreground focus:outline-none focus:border-mid-gray/60 transition-colors disabled:opacity-50 text-sm"
                >
                  <option value="">Select...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="project" className="block text-xs font-medium text-silver/70 mb-1.5">
                  Project
                </label>
                <select
                  id="project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={loading || !selectedClientId || projects.length === 0}
                  className="w-full px-3 py-2.5 bg-charcoal/50 border border-mid-gray/30 rounded-lg text-foreground focus:outline-none focus:border-mid-gray/60 transition-colors disabled:opacity-50 text-sm"
                >
                  <option value="">None</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-silver/70 mb-1.5">
                Content
              </label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                editable={!loading}
                clientId={selectedClientId || undefined}
                models={aiModels}
                clients={contextClients}
                projects={contextProjects}
                contentAssets={contextContent}
                journalEntries={contextJournal}
                writingFrameworks={contextFrameworks}
              />
            </div>
          </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-mid-gray/30">
          <AnimatedButton
              type="button"
            variant="secondary"
              onClick={handleClose}
              disabled={loading}
            className="h-10 px-4"
            >
              Cancel
          </AnimatedButton>
          <AnimatedButton
              type="submit"
            variant="primary"
              disabled={loading}
            className="h-10 px-4"
          >
              {loading ? 'Saving...' : 'Save'}
          </AnimatedButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
