'use client'

import { highlightMentions, groupEntriesByDate } from '@/lib/utils/mentions'
import { deleteJournalEntry } from '@/app/actions/journal'
import { useState } from 'react'
import Link from 'next/link'

interface Entry {
  id: string
  content: string
  tags: string[]
  created_at: string
  mentioned_clients: string[]
}

interface Client {
  id: string
  name: string
}

interface Props {
  entries: Entry[]
  clients: Client[]
  onEntryDeleted?: (id: string) => void
}

export function JournalFeed({ entries, clients, onEntryDeleted }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    
    setDeleting(id)
    try {
      await deleteJournalEntry(id)
      onEntryDeleted?.(id)
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete entry. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  // Get client name by ID
  function getClientName(clientId: string) {
    const client = clients.find(c => c.id === clientId)
    return client?.name || null
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-charcoal rounded-lg border border-mid-gray">
        <div className="text-5xl mb-4">📝</div>
        <p className="text-foreground font-medium mb-2">No entries yet</p>
        <p className="text-silver text-sm">Start capturing your ideas above!</p>
      </div>
    )
  }

  const groupedEntries = groupEntriesByDate(entries)

  return (
    <div className="space-y-6">
      {groupedEntries.map((group) => (
        <div key={group.label}>
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-silver">{group.label}</span>
            <div className="flex-1 h-px bg-mid-gray"></div>
          </div>

          {/* Entries */}
          <div className="space-y-3">
            {group.entries.map(entry => (
              <div 
                key={entry.id} 
                className="bg-charcoal rounded-lg border border-mid-gray p-4 shadow-sm hover:border-red-primary/50 transition-colors group"
              >
                {/* Content with highlighted mentions/tags */}
                <div
                  className="text-foreground whitespace-pre-wrap text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightMentions(entry.content) }}
                />

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-mid-gray/50">
                  {/* Timestamp */}
                  <span className="text-xs text-slate">
                    {new Date(entry.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="text-xs px-2 py-0.5 bg-red-primary/20 text-red-primary rounded-full font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mentioned Clients Links */}
                  {entry.mentioned_clients && entry.mentioned_clients.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.mentioned_clients.map(clientId => {
                        const clientName = getClientName(clientId)
                        if (!clientName) return null
                        return (
                          <Link
                            key={clientId}
                            href={`/dashboard/clients/${clientId}`}
                            className="text-xs px-2 py-0.5 bg-info/20 text-info rounded-full font-medium hover:bg-info/30 transition-colors flex items-center gap-1"
                          >
                            <span>→</span>
                            {clientName}
                          </Link>
                        )
                      })}
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleting === entry.id}
                    className="ml-auto text-xs text-slate hover:text-red-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {deleting === entry.id ? (
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-red-primary border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </span>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
