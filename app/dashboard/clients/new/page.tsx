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
          className="text-sm text-muted-foreground hover:text-[#4ECDC4] transition-colors inline-flex items-center gap-2"
        >
          ← Back to Clients
        </Link>
        <h1 className="mt-6 text-4xl font-bold mb-2 bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] bg-clip-text text-transparent">
          New Client
        </h1>
        <p className="text-muted-foreground">
          Add a new client to your workspace
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-600/10 border border-red-600/50 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Form */}
      <form action={handleSubmit} className="space-y-6 bg-card border border-card rounded-xl p-8 hover:border-[#4ECDC4]/50 transition-all duration-200">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-card-foreground mb-2">
            Client Name *
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            disabled={loading}
            className="mt-1 block w-full bg-input border border-input text-foreground rounded-lg px-4 py-2.5 shadow-sm focus:border-[#4ECDC4] focus:outline-none focus:ring-1 focus:ring-[#4ECDC4] disabled:opacity-50 transition-colors"
            placeholder="Acme Corporation"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            disabled={loading}
            className="mt-1 block w-full bg-input border border-input text-foreground rounded-lg px-4 py-2.5 shadow-sm focus:border-[#4ECDC4] focus:outline-none focus:ring-1 focus:ring-[#4ECDC4] disabled:opacity-50 transition-colors"
            placeholder="contact@acme.com"
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-card-foreground mb-2">
            Website
          </label>
          <input
            type="url"
            name="website"
            id="website"
            disabled={loading}
            className="mt-1 block w-full bg-input border border-input text-foreground rounded-lg px-4 py-2.5 shadow-sm focus:border-[#4ECDC4] focus:outline-none focus:ring-1 focus:ring-[#4ECDC4] disabled:opacity-50 transition-colors"
            placeholder="https://acme.com"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] text-white px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {loading ? 'Creating...' : 'Create Client'}
          </button>
          <Link
            href="/dashboard/clients"
            className="flex-1 text-center bg-card border border-card text-foreground px-6 py-2.5 rounded-lg hover:border-[#4ECDC4]/50 transition-all duration-200 font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

