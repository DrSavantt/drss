'use client'

import { useState } from 'react'
import { updateProject, deleteProject } from '@/app/actions/projects'
import { useRouter } from 'next/navigation'

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

export function ProjectModal({ project, onClose, onUpdate, onDelete }: ProjectModalProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Project' : 'Project Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-6">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!isEditing ? (
            // VIEW MODE
            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {project.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Client:</span>
                  <span className="text-sm font-medium text-purple-700">
                    {project.clients?.name || 'Unknown Client'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
                </div>
              )}

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                  <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                    {statusLabels[project.status as keyof typeof statusLabels]}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Priority</h4>
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Due Date</h4>
                  <p className="text-gray-600">
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Created</h4>
                <p className="text-sm text-gray-500">
                  {new Date(project.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Edit Project
                </button>
                <button
                  onClick={() => setIsDeleting(true)}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            // EDIT MODE
            <form action={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  disabled={loading}
                  defaultValue={project.name}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  disabled={loading}
                  defaultValue={project.description || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    disabled={loading}
                    defaultValue={project.status}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    name="priority"
                    id="priority"
                    disabled={loading}
                    defaultValue={project.priority}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  id="due_date"
                  disabled={loading}
                  defaultValue={project.due_date || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete {project.name}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete this project. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:bg-red-300"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                disabled={loading}
                className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
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
