'use client'

import { createContentAsset, getClientProjects } from '@/app/actions/content'
import { TiptapEditor } from '@/components/tiptap-editor'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function NewContentPage() {
  const params = useParams()
  const clientId = params.id as string

  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function loadProjects() {
      const data = await getClientProjects(clientId)
      setProjects(data)
    }
    loadProjects()
  }, [clientId])

  async function handleSubmit(formData: FormData) {
    setError(null)
    
    if (!content || content === '<p></p>') {
      setError('Content cannot be empty')
      return
    }
    
    setLoading(true)

    // Add content to form data
    formData.append('content_json', JSON.stringify(content))

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="text-sm text-red-primary hover:text-red-bright no-underline"
        >
          ← Back to Client
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">New Content Note</h1>
        <p className="mt-2 text-silver">
          Create a new note for this client
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-error/20 p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-charcoal rounded-lg border border-mid-gray p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-silver">
              Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              disabled={loading}
              className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground placeholder-slate shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-charcoal disabled:text-slate"
              placeholder="Q4 Campaign Copy"
            />
          </div>

          <div>
            <label htmlFor="project_id" className="block text-sm font-medium text-silver">
              Link to Project (Optional)
            </label>
            <select
              name="project_id"
              id="project_id"
              disabled={loading}
              className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-charcoal disabled:text-slate"
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
            <label className="block text-sm font-medium text-silver mb-2">
              Content *
            </label>
            <TiptapEditor
              content={content}
              onChange={(html) => setContent(html)}
              editable={!loading}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-red-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-red-bright disabled:bg-mid-gray disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Note'}
          </button>
          <Link
            href={`/dashboard/clients/${clientId}`}
            className="flex-1 text-center rounded-md bg-dark-gray px-4 py-2 text-sm font-semibold text-silver hover:bg-mid-gray no-underline transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
