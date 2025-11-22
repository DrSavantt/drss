'use client'

import { useState, useEffect } from 'react'
import { updateContentAsset, deleteContentAsset, getClientProjects } from '@/app/actions/content'
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
    note: 'bg-green-600/20 text-green-300 border border-green-600/30',
    research_pdf: 'bg-purple-600/20 text-purple-300 border border-purple-600/30',
    ad_copy: 'bg-orange-600/20 text-orange-300 border border-orange-600/30',
    email: 'bg-blue-600/20 text-blue-300 border border-blue-600/30',
    blog_post: 'bg-pink-600/20 text-pink-300 border border-pink-600/30',
    landing_page: 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/dashboard/clients/${content.client_id}`}
          className="text-sm text-[#4ECDC4] hover:text-[#FF6B6B] transition-colors"
        >
          ← Back to {content.clients?.name || 'Client'}
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-600/20 border border-red-600/30 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {!isEditing ? (
        // VIEW MODE
        <div className="space-y-6">
          <div className="bg-[#1a1f2e] rounded-lg border border-gray-700/50 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-3">
                  {content.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      typeColors[content.asset_type as keyof typeof typeColors] || 'bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    {content.asset_type.replace('_', ' ')}
                  </span>
                  {getClientName(content.clients) && (
                    <span className="px-3 py-1 text-sm font-medium rounded bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/30">
                      {getClientName(content.clients)}
                    </span>
                  )}
                  {content.projects && (
                    <span className="px-3 py-1 text-sm font-medium rounded bg-blue-600/20 text-blue-300 border border-blue-600/30">
                      {content.projects.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content Display */}
            <div className="prose prose-lg prose-invert max-w-none mb-6 mt-6">
              <div
                className="text-gray-300"
                dangerouslySetInnerHTML={{ __html: editorContent }}
              />
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-700/50 pt-4 mt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-400">Created:</span>
                  <span className="ml-2 text-gray-300">
                    {new Date(content.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-400">Last Updated:</span>
                  <span className="ml-2 text-gray-300">
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
          <div className="bg-[#1a1f2e] rounded-lg border border-gray-700/50 p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-400">
                Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                disabled={loading}
                defaultValue={content.title}
                className="mt-1 block w-full rounded-md bg-black border border-gray-700/50 px-3 py-2 text-white placeholder-gray-500 focus:border-[#4ECDC4]/50 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-400">
                Link to Project (Optional)
              </label>
              <select
                name="project_id"
                id="project_id"
                disabled={loading}
                defaultValue={content.project_id || ''}
                className="mt-1 block w-full rounded-md bg-black border border-gray-700/50 px-3 py-2 text-white focus:border-[#4ECDC4]/50 focus:outline-none disabled:opacity-50"
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
              <label className="block text-sm font-medium text-gray-400 mb-2">
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
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1f2e] border border-gray-700/50 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete {content.title}?
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete this content. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:bg-red-400"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                disabled={loading}
                className="flex-1 rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-600"
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

