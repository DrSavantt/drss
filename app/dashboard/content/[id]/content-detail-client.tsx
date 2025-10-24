'use client'

import { useState, useEffect } from 'react'
import { updateContentAsset, deleteContentAsset, getClientProjects } from '@/app/actions/content'
import { TiptapEditor } from '@/components/tiptap-editor'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Content {
  id: string
  title: string
  content_json: any
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
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    async function loadProjects() {
      const data = await getClientProjects(content.client_id)
      setProjects(data)
    }
    loadProjects()
  }, [content.client_id])

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
    } catch (err) {
      setError('Failed to update content')
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteContentAsset(content.id, content.client_id)
      router.push(`/dashboard/clients/${content.client_id}`)
    } catch (err) {
      setError('Failed to delete content')
      setLoading(false)
    }
  }

  const typeColors = {
    note: 'bg-green-100 text-green-800',
    research_pdf: 'bg-purple-100 text-purple-800',
    ad_copy: 'bg-orange-100 text-orange-800',
    email: 'bg-blue-100 text-blue-800',
    blog_post: 'bg-pink-100 text-pink-800',
    landing_page: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/dashboard/clients/${content.client_id}`}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to {content.clients?.name || 'Client'}
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!isEditing ? (
        // VIEW MODE
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {content.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      typeColors[content.asset_type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {content.asset_type.replace('_', ' ')}
                  </span>
                  {content.clients && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                      {content.clients.name}
                    </span>
                  )}
                  {content.projects && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                      {content.projects.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content Display */}
            <div className="prose prose-lg max-w-none mb-6 mt-6">
              <div
                className="text-gray-700"
                dangerouslySetInnerHTML={{ __html: editorContent }}
              />
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(content.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(content.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Edit Content
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                disabled={loading}
                defaultValue={content.title}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                Link to Project (Optional)
              </label>
              <select
                name="project_id"
                id="project_id"
                disabled={loading}
                defaultValue={content.project_id || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Delete Confirmation Dialog */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete {content.title}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete this content. This action cannot be undone.
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

