'use client'

import { useState, useEffect } from 'react'
import { TiptapEditor } from '@/components/tiptap-editor'
import { getClientProjects } from '@/app/actions/content'

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

  // Load projects when client changes
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

  // Reset form when modal closes or initial data changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setContent(initialData.content || '')
      setSelectedClientId(initialData.clientId || '')
      setSelectedProjectId(initialData.projectId || '')
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

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
      // Reset form
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-charcoal border border-mid-gray rounded-xl shadow-2xl max-w-4xl w-full my-8">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-mid-gray">
            <h2 className="text-2xl font-bold text-foreground">Create Note</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-silver hover:text-foreground transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-primary/20 border border-red-primary text-red-primary px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-silver mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                disabled={loading}
                className="w-full px-4 py-3 bg-dark-gray border border-mid-gray rounded-lg text-foreground placeholder-slate focus:outline-none focus:border-red-primary transition-colors disabled:opacity-50"
              />
            </div>

            {/* Client Selector */}
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-silver mb-2">
                Client *
              </label>
              <select
                id="client"
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value)
                  setSelectedProjectId('') // Reset project when client changes
                }}
                disabled={loading}
                className="w-full px-4 py-3 bg-dark-gray border border-mid-gray rounded-lg text-foreground focus:outline-none focus:border-red-primary transition-colors disabled:opacity-50"
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Selector */}
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-silver mb-2">
                Project (Optional)
              </label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={loading || !selectedClientId || projects.length === 0}
                className="w-full px-4 py-3 bg-dark-gray border border-mid-gray rounded-lg text-foreground focus:outline-none focus:border-red-primary transition-colors disabled:opacity-50"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {selectedClientId && projects.length === 0 && (
                <p className="mt-2 text-xs text-slate">No projects found for this client</p>
              )}
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-silver mb-2">
                Content *
              </label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                editable={!loading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-mid-gray">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-mid-gray text-silver hover:text-foreground hover:bg-dark-gray rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-primary text-white font-medium rounded-lg hover:bg-red-bright transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {loading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
