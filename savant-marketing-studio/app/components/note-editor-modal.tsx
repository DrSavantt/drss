'use client'

import { useState, useEffect } from 'react'
import { TiptapEditor } from '@/components/tiptap-editor'
import { getClientProjects } from '@/app/actions/content'
import { ResponsiveModal } from '@/components/responsive-modal'
import { AnimatedButton } from '@/components/animated-button'

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
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(val) => { if (!val) handleClose() }}
      title="New Note"
      className="max-w-2xl"
    >
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-mid-gray/30">
            <h2 className="text-lg font-semibold text-foreground">New Note</h2>
          </div>

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
              />
            </div>
          </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-mid-gray/30">
          <AnimatedButton
              type="button"
            variant="secondary"
              onClick={handleClose}
              disabled={loading}
            className="h-11 md:h-10 px-4"
            >
              Cancel
          </AnimatedButton>
          <AnimatedButton
              type="submit"
            variant="primary"
              disabled={loading}
            className="h-11 md:h-10 px-4"
          >
              {loading ? 'Saving...' : 'Save'}
          </AnimatedButton>
          </div>
        </form>
    </ResponsiveModal>
  )
}
