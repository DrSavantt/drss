'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  Send,
  ExternalLink,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getJournalEntriesByClient, createJournalEntry, getOrCreateInbox } from '@/app/actions/journal'
import { Badge } from '@/components/ui/badge'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface JournalEntry {
  id: string
  content: string
  tags?: string[]
  created_at: string
  chat_id?: string
  mentioned_clients?: string[]
  mentioned_projects?: string[]
  mentioned_content?: string[]
}

interface ClientCapturesProps {
  clientId: string
  clientName: string
  className?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClientCaptures({ clientId, clientName, className }: ClientCapturesProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newCapture, setNewCapture] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCaptures()
  }, [clientId])

  const fetchCaptures = async () => {
    try {
      const data = await getJournalEntriesByClient(clientId)
      setEntries(data.slice(0, 5)) // Show last 5 captures
    } catch (err) {
      console.error('Failed to fetch captures:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCapture = async () => {
    if (!newCapture.trim() || submitting) return
    
    setSubmitting(true)
    try {
      // Get or create inbox for quick captures
      const inboxId = await getOrCreateInbox()
      
      // Create entry with client mention
      await createJournalEntry(
        newCapture.trim(),
        inboxId,
        [clientId], // mentioned_clients
        [], // mentioned_projects
        [], // mentioned_content
        [] // tags
      )
      
      setNewCapture('')
      await fetchCaptures() // Refresh list
    } catch (err) {
      console.error('Failed to add capture:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddCapture()
    }
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full group hover:opacity-80 transition-opacity">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Quick Captures
                {entries.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {entries.length}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/journal"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View All
                </Link>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Quick Add Input */}
            <div className="space-y-2">
              <Textarea
                placeholder={`Quick note about ${clientName}...`}
                value={newCapture}
                onChange={(e) => setNewCapture(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={submitting}
                className="resize-none min-h-[80px]"
              />
              <Button 
                size="sm" 
                onClick={handleAddCapture}
                disabled={!newCapture.trim() || submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Add Capture
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Press Enter to save, Shift+Enter for new line
              </p>
            </div>

            {/* Entries List */}
            {loading ? (
              <div className="space-y-2 pt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="text-sm font-medium mb-2">No captures yet</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Add your first note about {clientName} above
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <p className="text-sm line-clamp-3 whitespace-pre-wrap mb-2">
                      {entry.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </div>
                      
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-1">
                          {entry.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                              #{tag}
                            </Badge>
                          ))}
                          {entry.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              +{entry.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {entries.length >= 5 && (
                  <div className="text-center pt-2">
                    <Link
                      href="/dashboard/journal"
                      className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      View all captures in Journal
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

