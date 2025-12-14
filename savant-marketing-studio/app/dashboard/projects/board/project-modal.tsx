'use client'

import { useState, useEffect } from 'react'
import { updateProject, deleteProject } from '@/app/actions/projects'
import { getJournalEntriesByProject } from '@/app/actions/journal'
import { highlightMentions } from '@/lib/utils/mentions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ResponsiveModal } from '@/components/responsive-modal'
import { AnimatedButton } from '@/components/animated-button'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  position: number
  created_at: string
  client_id: string
  clients: {
    name: string
  } | null
}

interface ProjectModalProps {
  project: Project
  onClose: () => void
  onUpdate?: (updatedProject: Project) => void
  onDelete?: (projectId: string) => void
}

interface JournalEntry {
  id: string
  content: string
  tags: string[]
  created_at: string
}

export function ProjectModal({ project, onClose, onUpdate, onDelete }: ProjectModalProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loadingJournal, setLoadingJournal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Fetch journal entries for this project
  useEffect(() => {
    async function fetchJournalEntries() {
      setLoadingJournal(true)
      try {
        const entries = await getJournalEntriesByProject(project.id)
        setJournalEntries(entries)
      } catch (error) {
        console.error('Failed to load journal entries:', error)
      } finally {
        setLoadingJournal(false)
      }
    }
    fetchJournalEntries()
  }, [project.id])

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    try {
      const result = await updateProject(project.id, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else {
        setIsEditing(false)
        setLoading(false)
        
        // Update local state immediately
        if (onUpdate) {
          const formValues = {
            ...project,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            status: formData.get('status') as string,
            priority: formData.get('priority') as string,
            due_date: formData.get('due_date') as string,
          }
          onUpdate(formValues)
        }
        
        router.refresh()
      }
    } catch {
      setError('Failed to update project')
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteProject(project.id, project.client_id)
      
      // Update local state immediately
      if (onDelete) {
        onDelete(project.id)
      }
      
      onClose()
      router.refresh()
    } catch {
      setError('Failed to delete project')
      setLoading(false)
    }
  }

  const statusLabels = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  }

  const priorityColors = {
    low: 'bg-slate/50 text-light-gray',
    medium: 'bg-warning/20 text-warning border border-warning/30',
    high: 'bg-red-bright/20 text-red-bright border border-red-bright/30',
    urgent: 'bg-red-primary/20 text-red-light border border-red-primary/30',
  }

  const statusColors = {
    backlog: 'bg-slate text-light-gray',
    in_progress: 'bg-info text-pure-white',
    in_review: 'bg-warning text-pure-black',
    done: 'bg-success text-pure-white',
  }

  return (
    <>
      <ResponsiveModal
        open={true}
        onOpenChange={(val) => { if (!val) onClose() }}
        title={isEditing ? 'Edit Project' : 'Project Details'}
        className="max-w-2xl"
      >
        <div className="space-y-6">
          {error && (
            <div className="mb-6 rounded-md bg-error/10 border border-error/30 p-4">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {!isEditing ? (
            // VIEW MODE
            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {project.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-silver">Client:</span>
                  <span className="text-sm font-medium text-info">
                    {project.clients?.name || 'Unknown Client'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div>
                  <h4 className="text-sm font-medium text-silver mb-2">Description</h4>
                  <p className="text-foreground whitespace-pre-wrap">{project.description}</p>
                </div>
              )}

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-silver mb-2">Status</h4>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    statusColors[project.status as keyof typeof statusColors]
                  }`}>
                    {statusLabels[project.status as keyof typeof statusLabels]}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-silver mb-2">Priority</h4>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                      priorityColors[project.priority as keyof typeof priorityColors]
                    }`}
                  >
                    {project.priority}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              {project.due_date && (
                <div>
                  <h4 className="text-sm font-medium text-silver mb-2">Due Date</h4>
                  <p className="text-foreground">
                    {new Date(project.due_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Created Date */}
              <div>
                <h4 className="text-sm font-medium text-silver mb-2">Created</h4>
                <p className="text-sm text-slate">
                  {new Date(project.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Journal Captures - Collapsible */}
              <div className="border-t border-mid-gray pt-6">
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

                {/* Collapsible Content */}
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
                          Create a journal capture mentioning @{project.name} to see it here
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
                              dangerouslySetInnerHTML={{ __html: highlightMentions(entry.content, [project.name, project.clients?.name].filter(Boolean) as string[]) }}
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

              <div className="flex gap-3 pt-4">
                <AnimatedButton
                  variant="primary"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 h-11 md:h-10"
                >
                  Edit Project
                </AnimatedButton>
                <AnimatedButton
                  variant="secondary"
                  onClick={() => setIsDeleting(true)}
                  className="h-11 md:h-10"
                >
                  Delete
                </AnimatedButton>
              </div>
            </div>
          ) : (
            // EDIT MODE
            <form action={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-silver">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  disabled={loading}
                  defaultValue={project.name}
                  className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground placeholder-slate shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-mid-gray disabled:text-slate"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-silver">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  disabled={loading}
                  defaultValue={project.description || ''}
                  className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground placeholder-slate shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-mid-gray disabled:text-slate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-silver">
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    disabled={loading}
                    defaultValue={project.status}
                    className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-mid-gray disabled:text-slate"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-silver">
                    Priority
                  </label>
                  <select
                    name="priority"
                    id="priority"
                    disabled={loading}
                    defaultValue={project.priority}
                    className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-mid-gray disabled:text-slate"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-silver">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  id="due_date"
                  disabled={loading}
                  defaultValue={project.due_date || ''}
                  className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-mid-gray disabled:text-slate"
                />
              </div>

              <div className="flex gap-3">
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1 h-11 md:h-10"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </AnimatedButton>
                <AnimatedButton
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="h-11 md:h-10"
                >
                  Cancel
                </AnimatedButton>
              </div>
            </form>
          )}
        </div>
      </ResponsiveModal>

      {isDeleting && (
        <ResponsiveModal
          open={isDeleting}
          onOpenChange={(val) => { if (!val) setIsDeleting(false) }}
          title={`Delete ${project.name}?`}
          className="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-silver">
              This will permanently delete this project. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <AnimatedButton
                variant="primary"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 h-11 md:h-10"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </AnimatedButton>
              <AnimatedButton
                variant="secondary"
                onClick={() => setIsDeleting(false)}
                disabled={loading}
                className="flex-1 h-11 md:h-10"
              >
                Cancel
              </AnimatedButton>
            </div>
          </div>
        </ResponsiveModal>
      )}
    </>
  )
}
