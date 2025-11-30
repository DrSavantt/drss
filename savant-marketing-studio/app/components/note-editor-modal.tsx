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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-dark-gray border border-mid-gray/40 rounded-lg shadow-xl max-w-2xl w-full my-8">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          {/* Header - Minimal */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-mid-gray/30">
            <h2 className="text-lg font-semibold text-foreground">New Note</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="p-1 text-silver/60 hover:text-silver transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-primary/10 border border-red-primary/30 text-red-primary px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {/* Title */}
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

            {/* Client & Project Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Client Selector */}
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

              {/* Project Selector */}
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

            {/* Content Editor */}
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

          {/* Footer - Minimal */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-mid-gray/30">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-silver/70 hover:text-silver transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-primary text-white text-sm font-medium rounded-lg hover:bg-red-bright transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
