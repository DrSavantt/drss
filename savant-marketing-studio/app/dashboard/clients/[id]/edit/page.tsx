'use client'

import { getClient, updateClient } from '@/app/actions/clients'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<{ id: string; name: string; email: string | null; website: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadClient() {
      const data = await getClient(clientId)
      if (!data) {
        router.push('/dashboard/clients')
        return
      }
      setClient(data)
    }
    loadClient()
  }, [clientId, router])

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    try {
      const result = await updateClient(clientId, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push(`/dashboard/clients/${clientId}`)
      }
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!client) {
    return <div className="text-center py-12 text-silver">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="text-sm text-red-primary hover:text-red-bright no-underline"
        >
          ← Back to Client
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Edit Client</h1>
        <p className="mt-2 text-silver">Update client information</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-error/20 p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6 bg-charcoal rounded-lg border border-mid-gray p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-silver">
            Client Name *
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            disabled={loading}
            defaultValue={client.name}
            className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground placeholder-slate shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-charcoal disabled:text-slate"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-silver">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            disabled={loading}
            defaultValue={client.email || ''}
            className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground placeholder-slate shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-charcoal disabled:text-slate"
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-silver">
            Website
          </label>
          <input
            type="url"
            name="website"
            id="website"
            disabled={loading}
            defaultValue={client.website || ''}
            className="mt-1 block w-full rounded-md border border-mid-gray bg-dark-gray px-3 py-2 text-foreground placeholder-slate shadow-sm focus:border-red-primary focus:outline-none focus:ring-red-primary disabled:bg-charcoal disabled:text-slate"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-red-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-red-bright disabled:bg-mid-gray disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
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
