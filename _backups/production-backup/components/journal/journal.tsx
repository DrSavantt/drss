"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Plus, Hash, AtSign, Send, Users, FolderKanban, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createJournalEntry, getJournalChats, getJournalEntries, getOrCreateInbox } from "@/app/actions/journal"
import { getClients } from "@/app/actions/clients"
import { getAllProjects, getAllContentAssets } from "@/app/actions/content"

// ============================================================================
// EXACT v0 CODE - Only data fetching added, UI unchanged
// ============================================================================

interface JournalEntry {
  id: string
  content: string
  timestamp: Date
  tags: string[]
  mentions: string[]
  mentionedClientNames?: string[]
}

interface Chat {
  id: string
  name: string
  entries: JournalEntry[]
}

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
  clientName?: string
}

interface ContentItem {
  id: string
  title: string
  clientName?: string
}

const allTags = ["AIDA", "PAS", "voice", "ideas", "research", "followup"]

export function Journal() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [newEntry, setNewEntry] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [showMentionPopup, setShowMentionPopup] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([])
  const [mentionedClientIds, setMentionedClientIds] = useState<string[]>([])
  const [mentionedProjectIds, setMentionedProjectIds] = useState<string[]>([])
  const [mentionedContentIds, setMentionedContentIds] = useState<string[]>([])
  const [mentionedClientNames, setMentionedClientNames] = useState<string[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch clients, projects, and content
  useEffect(() => {
    async function fetchMentionableItems() {
      try {
        const [clientsData, projectsData, contentData] = await Promise.all([
          getClients(),
          getAllProjects(),
          getAllContentAssets()
        ])
        
        setClients(clientsData.map(c => ({ id: c.id, name: c.name })))
        
        setProjects(projectsData.map(p => ({
          id: p.id,
          name: p.name,
          clientName: p.clients?.name
        })))
        
        setContentItems(contentData.map(c => ({
          id: c.id,
          title: c.title,
          clientName: c.clients?.name
        })))
      } catch (error) {
        console.error('Failed to fetch mentionable items:', error)
      }
    }
    fetchMentionableItems()
  }, [])

  // Filter items based on search
  useEffect(() => {
    const search = mentionSearch.toLowerCase()
    setFilteredClients(clients.filter(c => c.name.toLowerCase().includes(search)))
    setFilteredProjects(projects.filter(p => p.name.toLowerCase().includes(search)))
    setFilteredContent(contentItems.filter(c => (c.title || '').toLowerCase().includes(search)))
  }, [mentionSearch, clients, projects, contentItems])

  // Fetch chats and entries
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all chats
        let chatsData = await getJournalChats()
        
        // If no chats exist, create an Inbox
        if (chatsData.length === 0) {
          const inboxId = await getOrCreateInbox()
          chatsData = await getJournalChats()
        }
        
        // For each chat, fetch its entries
        const chatsWithEntries = await Promise.all(
          chatsData.map(async (chat) => {
            const entries = await getJournalEntries(chat.id)
            
            return {
              id: chat.id,
              name: chat.name,
              entries: entries.map(e => ({
                id: e.id,
                content: e.content,
                timestamp: new Date(e.created_at),
                tags: e.tags || [],
                mentions: extractMentions(e.content),
                mentionedClientNames: [], // Will be populated from DB when we add that field
              }))
            }
          })
        )
        
        setChats(chatsWithEntries)
        if (chatsWithEntries.length > 0) {
          setActiveChat(chatsWithEntries[0])
        }
      } catch (error) {
        console.error('Failed to fetch journal data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNewEntry(value)
    
    // Check for @ trigger
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(atIndex + 1)
      // Only show if no space before @ (or start of string/newline) and no space in search yet
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' '
      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) && !textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt)
        setShowMentionPopup(true)
        return
      }
    }
    setShowMentionPopup(false)
  }

  const insertMention = (type: 'client' | 'project' | 'content', item: Client | Project | ContentItem) => {
    const name = 'name' in item ? item.name : item.title
    const cursorPos = inputRef.current?.selectionStart || 0
    const textBeforeCursor = newEntry.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    const before = newEntry.slice(0, atIndex)
    const after = newEntry.slice(cursorPos)
    
    // Insert mention
    const newText = `${before}@${name} ${after}`
    setNewEntry(newText)
    setShowMentionPopup(false)
    
    // Track by type
    if (type === 'client') {
      setMentionedClientIds(prev => [...new Set([...prev, item.id])])
      setMentionedClientNames(prev => [...new Set([...prev, name])])
    } else if (type === 'project') {
      setMentionedProjectIds(prev => [...new Set([...prev, item.id])])
    } else if (type === 'content') {
      setMentionedContentIds(prev => [...new Set([...prev, item.id])])
    }
    
    // Focus input and set cursor position after mention
    setTimeout(() => {
      inputRef.current?.focus()
      const newCursorPos = atIndex + name.length + 2 // @ + name + space
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.trim() || !activeChat) return

    setSubmitting(true)
    try {
      // Parse tags (these are fine as single words)
      const tags = newEntry.match(/#(\w+)/g)?.map((t) => t.slice(1)) || []

      // Create entry in database
      await createJournalEntry(
        newEntry,              // content - first parameter
        activeChat.id,         // chatId - second parameter
        mentionedClientIds,    // mentioned_clients - actual client IDs
        mentionedProjectIds,   // mentioned_projects
        mentionedContentIds,   // mentioned_content
        tags                   // tags - last parameter
      )

      // Optimistically add to UI
      const entry: JournalEntry = {
        id: `temp-${Date.now()}`,
        content: newEntry,
        timestamp: new Date(),
        tags,
        mentions: extractMentions(newEntry),
        mentionedClientNames: [...mentionedClientNames],
      }

      setChats((prev) =>
        prev.map((chat) => (chat.id === activeChat.id ? { ...chat, entries: [entry, ...chat.entries] } : chat)),
      )
      setActiveChat((prev) => prev ? { ...prev, entries: [entry, ...prev.entries] } : null)
      setNewEntry("")
      setMentionedClientIds([])
      setMentionedProjectIds([])
      setMentionedContentIds([])
      setMentionedClientNames([])
    } catch (error) {
      console.error('Failed to create entry:', error)
      alert('Failed to create entry')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle keyboard events and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMentionPopup) {
        setShowMentionPopup(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (showMentionPopup && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        // Check if click is not on the popup itself
        const target = e.target as HTMLElement
        if (!target.closest('.mention-popup')) {
          setShowMentionPopup(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMentionPopup])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
          <p className="text-muted-foreground">Capture ideas, notes, and quick thoughts</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-96 rounded-xl border border-border bg-card animate-pulse" />
          <div className="h-96 rounded-xl border border-border bg-card animate-pulse" />
        </div>
      </div>
    )
  }

  if (!activeChat) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
          <p className="text-muted-foreground">Capture ideas, notes, and quick thoughts</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <p className="text-muted-foreground">No journal chats found</p>
          <p className="text-sm text-muted-foreground">Create a chat to start journaling</p>
        </div>
      </div>
    )
  }

  // Function to render entry with highlighted mentions and tags
  const renderContent = (content: string, mentionedClientNames: string[] = []) => {
    let html = content
    
    // Escape HTML first to prevent XSS
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    
    // Only highlight names we KNOW are clients (from mentionedClientNames)
    mentionedClientNames.forEach(clientName => {
      // Escape special regex characters in client name
      const escapedName = clientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`@${escapedName}`, 'g')
      html = html.replace(regex, `<span class="text-cyan-400 font-medium">@${clientName}</span>`)
    })
    
    // Highlight #tags
    html = html.replace(
      /#(\w+)/g,
      '<span class="text-blue-400 font-medium">#$1</span>'
    )
    
    return html
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
        <p className="text-muted-foreground">Capture ideas, notes, and quick thoughts</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Chats */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Chats</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1 px-3 pb-3">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeChat.id === chat.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        activeChat.id === chat.id ? "bg-primary" : "bg-muted-foreground/50",
                      )}
                    />
                    {chat.name}
                    <span className="ml-auto text-xs text-muted-foreground">{chat.entries.length}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Hash className="h-3 w-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>{activeChat.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Created Dec 20 • {activeChat.entries.length} entries</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Entries */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {activeChat.entries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {entry.timestamp.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p 
                    className="text-sm text-foreground whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: renderContent(entry.content, entry.mentionedClientNames) }}
                  />
                </div>
              ))}
              {activeChat.entries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No entries yet</p>
                  <p className="text-sm text-muted-foreground">Start typing below to add your first note</p>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Textarea
                    ref={inputRef}
                    placeholder="Type a new entry... Use @ to mention clients, # to add tags"
                    value={newEntry}
                    onChange={handleInputChange}
                    className="min-h-[80px] pr-20 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !showMentionPopup) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button type="button" className="p-1 text-muted-foreground hover:text-foreground">
                      <AtSign className="h-4 w-4" />
                    </button>
                    <button type="button" className="p-1 text-muted-foreground hover:text-foreground">
                      <Hash className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Mention Autocomplete Popup */}
                  {showMentionPopup && (filteredClients.length > 0 || filteredProjects.length > 0 || filteredContent.length > 0) && (
                    <div className="mention-popup absolute bottom-full left-0 mb-2 w-72 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
                      {/* Header */}
                      <div className="px-3 py-2 border-b border-border bg-muted/50">
                        <span className="text-xs text-muted-foreground">
                          {mentionSearch ? `Searching "${mentionSearch}"` : 'Link to...'}
                        </span>
                      </div>
                      
                      {/* Categories */}
                      <div className="max-h-64 overflow-y-auto">
                        {/* Clients Section */}
                        {filteredClients.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2 bg-background/50 sticky top-0">
                              <Users className="w-3 h-3" />
                              Clients
                            </div>
                            {filteredClients.slice(0, 4).map(client => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => insertMention('client', client)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                              >
                                <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                                <span className="text-foreground truncate">{client.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Projects Section */}
                        {filteredProjects.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2 bg-background/50 sticky top-0">
                              <FolderKanban className="w-3 h-3" />
                              Projects
                            </div>
                            {filteredProjects.slice(0, 4).map(project => (
                              <button
                                key={project.id}
                                type="button"
                                onClick={() => insertMention('project', project)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                              >
                                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-foreground truncate">{project.name}</span>
                                  {project.clientName && (
                                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{project.clientName}</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Content Section */}
                        {filteredContent.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2 bg-background/50 sticky top-0">
                              <FileText className="w-3 h-3" />
                              Content
                            </div>
                            {filteredContent.slice(0, 4).map(content => (
                              <button
                                key={content.id}
                                type="button"
                                onClick={() => insertMention('content', content)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                              >
                                <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-foreground truncate">{content.title}</span>
                                  {content.clientName && (
                                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{content.clientName}</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Empty state - only show if actively searching */}
                      {filteredClients.length === 0 && filteredProjects.length === 0 && filteredContent.length === 0 && mentionSearch && (
                        <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                          No matches found for "{mentionSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={!newEntry.trim() || submitting} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper: Extract @mentions from content (improved to handle multi-word names)
function extractMentions(content: string): string[] {
  return content.match(/@([^\s#@]+(?:\s+[^\s#@]+)*)/g)?.map((m) => m.slice(1).trim()) || []
}
