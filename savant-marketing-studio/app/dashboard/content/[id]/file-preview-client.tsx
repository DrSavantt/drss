'use client'

import { useState, useEffect } from 'react'
import { getJournalEntriesByContent, getJournalEntriesByClient } from '@/app/actions/journal'
import { highlightMentions } from '@/lib/utils/mentions'
import Link from 'next/link'
import { FileText, ExternalLink } from 'lucide-react'

interface Content {
  id: string
  title: string
  asset_type: string
  file_url: string | null
  file_size: number | null
  file_type: string | null
  created_at: string
  updated_at: string
  client_id: string
  clients: { name: string } | null
  projects: { name: string } | null
}

interface JournalEntry {
  id: string
  content: string
  tags: string[]
  created_at: string
}

interface Props {
  content: Content
}

export function FilePreviewClient({ content }: Props) {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loadingJournal, setLoadingJournal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Fetch journal entries
  useEffect(() => {
    async function fetchJournalEntries() {
      setLoadingJournal(true)
      try {
        console.log('[FilePreview] Fetching entries for content:', content.id, 'title:', content.title)
        
        // Get entries from content chat
        const contentEntries = await getJournalEntriesByContent(content.id)
        console.log('[FilePreview] Content entries:', contentEntries.length)
        
        // Get entries mentioning the client
        const clientEntries = await getJournalEntriesByClient(content.client_id)
        console.log('[FilePreview] Client entries:', clientEntries.length)
        
        // Combine and dedupe by id
        const allEntries = [...contentEntries, ...clientEntries]
        const uniqueEntries = Array.from(
          new Map(allEntries.map(entry => [entry.id, entry])).values()
        )
        
        // Sort by created_at descending
        uniqueEntries.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        console.log('[FilePreview] Total unique entries:', uniqueEntries.length)
        setJournalEntries(uniqueEntries)
      } catch (error) {
        console.error('Failed to load journal entries:', error)
      } finally {
        setLoadingJournal(false)
      }
    }
    fetchJournalEntries()
  }, [content.id, content.client_id, content.title])

  // Determine if file is an image
  const isImage = content.file_type?.startsWith('image/')
  const isPDF = content.file_type === 'application/pdf'

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/clients/${content.client_id}`}
          className="text-sm text-silver hover:text-red-primary transition-colors flex items-center gap-2"
        >
          ← Back to {content.clients?.name || 'Client'}
        </Link>
      </div>

      {/* File Header Card */}
      <div className="bg-charcoal border border-mid-gray rounded-xl p-8 hover:border-red-bright/50 transition-all duration-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 text-red-primary">{content.title}</h1>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-success/20 text-success border border-success/30">
                {content.asset_type.replace('_', ' ')}
              </span>
              {content.clients && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate/20 text-foreground border border-slate/30">
                  {content.clients.name}
                </span>
              )}
              {content.projects && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-info/20 text-info border border-info/30">
                  {content.projects.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-mid-gray pt-6 mt-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-silver">Created</dt>
              <dd className="mt-1.5 text-sm text-foreground">
                {new Date(content.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-silver">File Size</dt>
              <dd className="mt-1.5 text-sm text-foreground">
                {content.file_size ? `${(content.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <a
            href={content.file_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-primary px-6 py-3 text-sm font-semibold text-pure-white hover:bg-red-bright transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open File
          </a>
        </div>

        {/* Quick Captures - Collapsible */}
        <div className="border-t border-mid-gray pt-6 mt-6">
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
                    Create a journal capture mentioning @{content.title} to see it here
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
                        dangerouslySetInnerHTML={{ __html: highlightMentions(entry.content) }}
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File Preview Section */}
      <div className="bg-charcoal border border-mid-gray rounded-xl p-8 hover:border-red-bright/50 transition-all duration-200">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Preview</h2>
        
        {isImage ? (
          <div className="rounded-lg overflow-hidden border border-mid-gray">
            <img
              src={content.file_url || ''}
              alt={content.title}
              className="w-full h-auto"
            />
          </div>
        ) : isPDF ? (
          <div className="rounded-lg overflow-hidden border border-mid-gray bg-dark-gray" style={{ height: '800px' }}>
            <iframe
              src={content.file_url || ''}
              className="w-full h-full"
              title={content.title}
            />
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-mid-gray rounded-lg">
            <FileText size={48} className="mx-auto text-slate mb-4" />
            <h3 className="text-base font-medium text-foreground mb-2">Preview not available</h3>
            <p className="text-sm text-silver">
              Click the download button above to view this file
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
