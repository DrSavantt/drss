'use client'

import { createClient } from '@/app/actions/clients'
import { useState } from 'react'
import Link from 'next/link'

export default function NewClientPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    try {
      const result = await createClient(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // If successful, the server action will redirect
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/clients"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to Clients
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">New Client</h1>
        <p className="mt-2 text-gray-600">
          Add a new client to your workspace
        </p>
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Acme Corporation"
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="contact@acme.com"
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="https://acme.com"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Client'}
          </button>
          <Link
            href="/dashboard/clients"
            className="flex-1 text-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

