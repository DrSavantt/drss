'use client'

import { createClient } from '@/app/actions/clients'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
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
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/clients"
          className="text-sm text-silver hover:text-red-primary transition-colors inline-flex items-center gap-2 no-underline"
        >
          ← Back to Clients
        </Link>
        <h1 className="mt-6 text-4xl font-bold mb-2 text-red-primary">
          New Client
        </h1>
        <p className="text-silver">
          Add a new client to your workspace
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-error/20 border border-error/50 p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Form */}
      <form action={handleSubmit} className="space-y-6 bg-charcoal border border-mid-gray rounded-xl p-8 hover:border-red-primary/50 transition-all duration-200">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-silver mb-2">
            Client Name *
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            disabled={loading}
            className="mt-1 block w-full bg-dark-gray border border-mid-gray text-foreground rounded-lg px-4 py-2.5 shadow-sm focus:border-red-primary focus:outline-none focus:ring-1 focus:ring-red-primary disabled:bg-charcoal disabled:text-slate transition-colors placeholder-slate"
            placeholder="Acme Corporation"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-silver mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            disabled={loading}
            className="mt-1 block w-full bg-dark-gray border border-mid-gray text-foreground rounded-lg px-4 py-2.5 shadow-sm focus:border-red-primary focus:outline-none focus:ring-1 focus:ring-red-primary disabled:bg-charcoal disabled:text-slate transition-colors placeholder-slate"
            placeholder="contact@acme.com"
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-silver mb-2">
            Website
          </label>
          <input
            type="url"
            name="website"
            id="website"
            disabled={loading}
            className="mt-1 block w-full bg-dark-gray border border-mid-gray text-foreground rounded-lg px-4 py-2.5 shadow-sm focus:border-red-primary focus:outline-none focus:ring-1 focus:ring-red-primary disabled:bg-charcoal disabled:text-slate transition-colors placeholder-slate"
            placeholder="https://acme.com"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-red-primary text-foreground px-6 py-2.5 rounded-lg hover:bg-red-bright disabled:bg-mid-gray disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Client'}
          </button>
          <Link
            href="/dashboard/clients"
            className="flex-1 text-center bg-dark-gray border border-mid-gray text-silver px-6 py-2.5 rounded-lg hover:border-red-primary/50 hover:bg-mid-gray transition-all duration-200 font-medium no-underline"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
