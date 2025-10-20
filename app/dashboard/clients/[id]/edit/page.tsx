'use client'

import { getClient, updateClient } from '@/app/actions/clients'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<any>(null)
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
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!client) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to Client
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Edit Client</h1>
        <p className="mt-2 text-gray-600">Update client information</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Client Name *
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            disabled={loading}
            defaultValue={client.name}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            disabled={loading}
            defaultValue={client.email || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            type="url"
            name="website"
            id="website"
            disabled={loading}
            defaultValue={client.website || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href={`/dashboard/clients/${clientId}`}
            className="flex-1 text-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

