'use client'

import { useState } from 'react'
import { createJournalEntry } from '@/app/actions/journal'
import { parseMentions } from '@/lib/utils/mentions'

interface Props {
  clients: { id: string; name: string }[]
}

export function JournalCapture({ clients }: Props) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)
    try {
      const { mentioned_clients, tags } = parseMentions(content, clients)
      await createJournalEntry(content, mentioned_clients, tags)
      setContent('')
    } catch (err) {
      console.error('Failed to save:', err)
      setError('Failed to save entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Quick idea... Use @ClientName and #tags"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={3}
      />
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 gap-2">
        <span className="text-xs sm:text-sm text-gray-500">
          @mention clients • #tag ideas
        </span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {loading ? 'Saving...' : 'Capture'}
        </button>
      </div>
    </form>
  )
}

