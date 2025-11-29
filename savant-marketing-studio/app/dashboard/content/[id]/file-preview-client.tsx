'use client'

import { useState, useEffect } from 'react'
import { getJournalEntriesByContent, getJournalEntriesByClient } from '@/app/actions/journal'
import { highlightMentions } from '@/lib/utils/mentions'
import Link from 'next/link'
import { FileText, Download, Calendar, User } from 'lucide-react'

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

  // Fetch journal entries
  useEffect(() => {
    async function fetchJournalEntries() {
      setLoadingJournal(true)
      try {
        // Get entries from content chat
        const contentEntries = await getJournalEntriesByContent(content.id)
        
        // Get entries mentioning the client
        const clientEntries = await getJournalEntriesByClient(content.client_id)
        
        // Combine and dedupe by id
        const allEntries = [...contentEntries, ...clientEntries]
        const uniqueEntries = Array.from(
          new Map(allEntries.map(entry => [entry.id, entry])).values()
        )
        
        // Sort by created_at descending
        uniqueEntries.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        setJournalEntries(uniqueEntries)
      } catch (error) {
        console.error('Failed to load journal entries:', error)
      } finally {
        setLoadingJournal(false)
      }
    }
    fetchJournalEntries()
  }, [content.id, content.client_id])

  // Determine if file is an image
  const isImage = content.file_type?.startsWith('image/')
  const isPDF = content.file_type === 'application/pdf'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/clients/${content.client_id}`}
          className="text-sm text-red-primary hover:text-red-bright no-underline flex items-center gap-2"
        >
          ← Back to {content.clients?.name || 'Client'}
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Preview - Left Side (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Info Card */}
          <div className="bg-charcoal border border-mid-gray rounded-xl p-6">
            <h1 className="text-3xl font-bold text-foreground mb-4">{content.title}</h1>
            
            <div className="flex flex-wrap gap-3 mb-6">
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

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-dark-gray rounded-lg border border-mid-gray">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-silver" />
                <div>
                  <p className="text-xs text-silver">Created</p>
                  <p className="text-foreground">{new Date(content.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-silver" />
                <div>
                  <p className="text-xs text-silver">Size</p>
                  <p className="text-foreground">
                    {content.file_size ? `${(content.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <a
              href={content.file_url || '#'}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-primary px-6 py-3 text-sm font-semibold text-pure-white hover:bg-red-bright transition-colors"
            >
              <Download className="w-4 h-4" />
              Download File
            </a>
          </div>

          {/* File Preview */}
          <div className="bg-charcoal border border-mid-gray rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Preview</h2>
            
            {isImage ? (
              <div className="rounded-lg overflow-hidden border border-mid-gray">
                <img
                  src={content.file_url || ''}
                  alt={content.title}
                  className="w-full h-auto"
                />
              </div>
            ) : isPDF ? (
              <div className="rounded-lg overflow-hidden border border-mid-gray bg-dark-gray" style={{ height: '600px' }}>
                <iframe
                  src={content.file_url || ''}
                  className="w-full h-full"
                  title={content.title}
                />
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-mid-gray rounded-lg">
                <FileText className="w-16 h-16 mx-auto text-slate mb-4" />
                <p className="text-silver">Preview not available for this file type</p>
                <p className="text-sm text-slate mt-2">Click the download button above to view the file</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Captures - Right Sidebar (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-charcoal border border-mid-gray rounded-xl p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h2 className="text-xl font-semibold text-foreground">Quick Captures</h2>
              </div>
              <Link
                href="/dashboard/journal"
                className="text-sm text-red-primary hover:text-red-bright font-medium transition-colors"
              >
                View All →
              </Link>
            </div>

            {loadingJournal ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-red-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : journalEntries.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-mid-gray rounded-lg">
                <span className="text-4xl mb-3 block">📭</span>
                <h3 className="text-sm font-medium text-foreground mb-2">No captures yet</h3>
                <p className="text-xs text-silver mb-4">
                  Create a journal capture mentioning this file to see it here
                </p>
                <Link
                  href="/dashboard/journal"
                  className="inline-block bg-red-primary text-pure-white px-4 py-2 rounded-lg hover:bg-red-bright transition-all duration-200 text-xs font-medium"
                >
                  Create Capture
                </Link>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
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
                          {entry.tags.slice(0, 2).map((tag) => (
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
