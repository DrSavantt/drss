'use client'

import { highlightMentions } from '@/lib/utils/mentions'
import { deleteJournalEntry } from '@/app/actions/journal'
import { useState } from 'react'

interface Entry {
  id: string
  content: string
  tags: string[]
  created_at: string
  mentioned_clients: string[]
}

export function JournalFeed({ entries }: { entries: Entry[] }) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    
    setDeleting(id)
    try {
      await deleteJournalEntry(id)
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete entry. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No entries yet. Start capturing your ideas above!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map(entry => (
        <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div
            className="text-gray-900 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: highlightMentions(entry.content) }}
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3">
            <span className="text-xs sm:text-sm text-gray-500">
              {new Date(entry.created_at).toLocaleString()}
            </span>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => handleDelete(entry.id)}
              disabled={deleting === entry.id}
              className="ml-auto text-xs sm:text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting === entry.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

