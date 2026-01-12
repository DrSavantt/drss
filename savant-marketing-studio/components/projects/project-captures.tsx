'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, FileText, Loader2, Plus } from 'lucide-react'
import { getJournalEntriesByProject } from '@/app/actions/journal'
import { cn } from '@/lib/utils'

interface JournalEntry {
  id: string
  content: string
  tags: string[] | null
  created_at: string
}

interface ProjectCapturesProps {
  projectId: string
  projectName: string
}

export function ProjectCaptures({ projectId, projectName }: ProjectCapturesProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    async function fetchEntries() {
      try {
        const data = await getJournalEntriesByProject(projectId)
        setEntries(data || [])
      } catch (error) {
        console.error('Failed to load captures:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEntries()
  }, [projectId])

  // Format relative time
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Highlight @mentions in content
  function highlightMentions(content: string): string {
    // Highlight @mentions with project name
    return content.replace(
      /@(\w+)/g,
      '<span class="text-primary font-medium">@$1</span>'
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Quick Captures</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/journal"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View All →
          </Link>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 pb-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-medium mb-1">No captures yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create a journal capture mentioning @{projectName}
              </p>
              <Link
                href="/dashboard/journal"
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Create Capture
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <p
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightMentions(entry.content),
                    }}
                  />
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{formatRelativeTime(entry.created_at)}</span>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex gap-1">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-primary/10 text-primary rounded"
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
  )
}
