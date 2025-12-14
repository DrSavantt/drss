'use client'

import { useState, useEffect } from 'react'
import { getJournalEntriesByClient } from '@/app/actions/journal'
import { highlightMentions } from '@/lib/utils/mentions'
import Link from 'next/link'

interface JournalEntry {
  id: string
  content: string
  tags: string[]
  created_at: string
}

interface Props {
  clientId: string
  clientName: string
}

export function ClientCaptures({ clientId, clientName }: Props) {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loadingJournal, setLoadingJournal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    async function fetchJournalEntries() {
      setLoadingJournal(true)
      try {
        const entries = await getJournalEntriesByClient(clientId)
        setJournalEntries(entries)
      } catch (error) {
        console.error('Failed to load journal entries:', error)
      } finally {
        setLoadingJournal(false)
      }
    }
    fetchJournalEntries()
  }, [clientId])

  return (
    <div className="border-t border-mid-gray pt-6 mt-6">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📝</span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quick Captures</h3>
            <p className="text-xs text-silver">
              {loadingJournal ? 'Loading...' : `${journalEntries.length} ${journalEntries.length === 1 ? 'entry' : 'entries'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/journal"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-red-primary hover:text-red-bright font-medium transition-colors"
          >
            View All →
          </Link>
          <svg
            className={`w-5 h-5 text-silver transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="mt-6">
          {loadingJournal ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : journalEntries.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-mid-gray rounded-lg">
              <span className="text-4xl mb-3 block">📭</span>
              <h3 className="text-base font-medium text-foreground mb-2">No captures yet</h3>
              <p className="text-sm text-silver mb-4">
                Create a journal capture mentioning @{clientName} to see it here
              </p>
              <Link
                href="/dashboard/journal"
                className="inline-block bg-red-primary text-pure-white px-4 py-2 rounded-lg hover:bg-red-bright transition-all duration-200 text-sm font-medium"
              >
                Create Capture
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {journalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-mid-gray rounded-lg p-4 hover:border-red-bright/50 transition-all duration-200"
                >
                  <div
                    className="text-sm text-foreground mb-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: highlightMentions(entry.content, [clientName]) }}
                  />
                  <div className="flex items-center justify-between text-xs text-slate">
                    <div className="flex items-center gap-3">
                      <span>
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-1">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-red-primary/20 text-red-primary rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {journalEntries.length >= 10 && (
                <div className="text-center pt-2">
                  <Link
                    href="/dashboard/journal"
                    className="text-sm text-red-primary hover:text-red-bright font-medium transition-colors"
                  >
                    View all captures →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
