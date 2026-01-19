'use client'

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { format } from 'date-fns'
import { Plus, Hash, AtSign, Send, Users, FolderKanban, FileText, Trash2, X, Pin, PinOff, Check, ArrowRight, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { escapeHtml } from "@/lib/utils/sanitize-html"
import { 
  createJournalEntry, 
  getJournalEntries, 
  getOrCreateInbox,
  deleteJournalEntry,
  togglePinJournalEntry,
  bulkDeleteJournalEntries,
  bulkPinJournalEntries,
  bulkUnpinJournalEntries,
  bulkAddTagsToJournalEntries,
  createChatForClient,
  createChatForProject,
  createChatForContent,
  createGeneralChat,
  getJournalChatsWithEntries
} from "@/app/actions/journal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JournalBulkActionBar } from "@/app/components/journal-bulk-action-bar"
import { Checkbox } from "@/components/ui/checkbox"
import { ConvertToContentDialog } from "./convert-to-content-dialog"

// ============================================================================
// TYPES
// ============================================================================

interface JournalEntry {
  id: string
  content: string
  timestamp: Date
  tags: string[]
  mentions: string[]
  mentionedClientNames?: string[]
  is_pinned?: boolean
  is_converted?: boolean
  converted_to_content_id?: string | null
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

interface JournalContentProps {
  initialChats: Chat[]
  initialClients: Client[]
  initialProjects: Project[]
  initialContentItems: ContentItem[]
}

const allTags = ["AIDA", "PAS", "voice", "ideas", "research", "followup"]

// Helper: Extract @mentions from content
function extractMentions(content: string): string[] {
  return content.match(/@([^\s#@]+(?:\s+[^\s#@]+)*)/g)?.map((m) => m.slice(1).trim()) || []
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JournalContent({ 
  initialChats, 
  initialClients, 
  initialProjects, 
  initialContentItems 
}: JournalContentProps) {
  const [chats, setChats] = useState<Chat[]>(initialChats)
  const [activeChat, setActiveChat] = useState<Chat | null>(initialChats[0] || null)
  const [newEntry, setNewEntry] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [clients] = useState<Client[]>(initialClients)
  const [projects] = useState<Project[]>(initialProjects)
  const [contentItems] = useState<ContentItem[]>(initialContentItems)
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
  
  // Create Chat Dialog state
  const [showCreateChatDialog, setShowCreateChatDialog] = useState(false)
  const [newChatType, setNewChatType] = useState<'general' | 'client' | 'project' | 'content'>('general')
  const [selectedEntityId, setSelectedEntityId] = useState<string>("")
  const [creatingChat, setCreatingChat] = useState(false)
  
  // Bulk selection state
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [showBulkTagInput, setShowBulkTagInput] = useState(false)
  const [bulkTags, setBulkTags] = useState("")
  
  // Convert to content state
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [entriesToConvert, setEntriesToConvert] = useState<string[]>([])
  const [convertEntryContent, setConvertEntryContent] = useState<string>('')
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Track mounted state
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Filter items based on search
  useEffect(() => {
    const search = mentionSearch.toLowerCase()
    setFilteredClients(clients.filter(c => c.name.toLowerCase().includes(search)))
    setFilteredProjects(projects.filter(p => p.name.toLowerCase().includes(search)))
    setFilteredContent(contentItems.filter(c => (c.title || '').toLowerCase().includes(search)))
  }, [mentionSearch, clients, projects, contentItems])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNewEntry(value)
    
    // Check for @ trigger
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(atIndex + 1)
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
    
    const newText = `${before}@${name} ${after}`
    setNewEntry(newText)
    setShowMentionPopup(false)
    
    if (type === 'client') {
      setMentionedClientIds(prev => [...new Set([...prev, item.id])])
      setMentionedClientNames(prev => [...new Set([...prev, name])])
    } else if (type === 'project') {
      setMentionedProjectIds(prev => [...new Set([...prev, item.id])])
    } else if (type === 'content') {
      setMentionedContentIds(prev => [...new Set([...prev, item.id])])
    }
    
    setTimeout(() => {
      inputRef.current?.focus()
      const newCursorPos = atIndex + name.length + 2
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.trim() || !activeChat) return

    setSubmitting(true)
    try {
      const tags = newEntry.match(/#(\w+)/g)?.map((t) => t.slice(1)) || []

      await createJournalEntry(
        newEntry,
        activeChat.id,
        mentionedClientIds,
        mentionedProjectIds,
        mentionedContentIds,
        tags
      )

      // Optimistically add to UI
      const entry: JournalEntry = {
        id: `temp-${Date.now()}`,
        content: newEntry,
        timestamp: new Date(),
        tags,
        mentions: extractMentions(newEntry),
        mentionedClientNames: [...mentionedClientNames],
        is_pinned: false,
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

  // Handler: Create new chat
  const handleCreateChat = async () => {
    setCreatingChat(true)
    try {
      let newChat
      if (newChatType === 'general') {
        newChat = await createGeneralChat()
      } else if (newChatType === 'client' && selectedEntityId) {
        const client = clients.find(c => c.id === selectedEntityId)
        if (client) {
          newChat = await createChatForClient(selectedEntityId, client.name)
        }
      } else if (newChatType === 'project' && selectedEntityId) {
        const project = projects.find(p => p.id === selectedEntityId)
        if (project) {
          newChat = await createChatForProject(selectedEntityId, project.name)
        }
      } else if (newChatType === 'content' && selectedEntityId) {
        const content = contentItems.find(c => c.id === selectedEntityId)
        if (content) {
          newChat = await createChatForContent(selectedEntityId, content.title)
        }
      }

      // Refresh chats
      const chatsData = await getJournalChatsWithEntries()
      const chatsWithEntries = chatsData.map((chat: any) => ({
        id: chat.id,
        name: chat.name,
        entries: (chat.entries || []).map((e: any) => ({
          id: e.id,
          content: e.content,
          timestamp: new Date(e.created_at),
          tags: e.tags || [],
          mentions: extractMentions(e.content),
          mentionedClientNames: [],
          is_pinned: e.is_pinned || false,
          is_converted: e.is_converted || false,
          converted_to_content_id: e.converted_to_content_id || null,
        }))
      }))
      setChats(chatsWithEntries)
      
      if (newChat) {
        const newActiveChat = chatsWithEntries.find((c: Chat) => c.id === newChat.id)
        if (newActiveChat) {
          setActiveChat(newActiveChat)
        }
      }
      
      setShowCreateChatDialog(false)
      setNewChatType('general')
      setSelectedEntityId("")
    } catch (error) {
      console.error('Failed to create chat:', error)
      alert('Failed to create chat')
    } finally {
      setCreatingChat(false)
    }
  }

  // Handler: Delete individual entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return
    
    try {
      await deleteJournalEntry(entryId)
      
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          entries: chat.entries.filter(e => e.id !== entryId)
        }))
      )
      setActiveChat((prev) => prev ? {
        ...prev,
        entries: prev.entries.filter(e => e.id !== entryId)
      } : null)
    } catch (error) {
      console.error('Failed to delete entry:', error)
      alert('Failed to delete entry')
    }
  }

  // Handler: Toggle entry selection
  const handleToggleSelection = (entryId: string) => {
    setSelectedEntries((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

  // Handler: Bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedEntries.size} entries?`)) return
    
    try {
      await bulkDeleteJournalEntries(Array.from(selectedEntries))
      
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          entries: chat.entries.filter(e => !selectedEntries.has(e.id))
        }))
      )
      setActiveChat((prev) => prev ? {
        ...prev,
        entries: prev.entries.filter(e => !selectedEntries.has(e.id))
      } : null)
      
      setSelectedEntries(new Set())
    } catch (error) {
      console.error('Failed to bulk delete entries:', error)
      alert('Failed to bulk delete entries')
    }
  }

  // Handler: Bulk pin
  const handleBulkPin = async () => {
    try {
      await bulkPinJournalEntries(Array.from(selectedEntries))
      
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          entries: chat.entries.map(e => 
            selectedEntries.has(e.id) ? { ...e, is_pinned: true } : e
          )
        }))
      )
      setActiveChat((prev) => prev ? {
        ...prev,
        entries: prev.entries.map(e => 
          selectedEntries.has(e.id) ? { ...e, is_pinned: true } : e
        )
      } : null)
      
      setSelectedEntries(new Set())
    } catch (error) {
      console.error('Failed to pin entries:', error)
      alert('Failed to pin entries')
    }
  }

  // Handler: Bulk unpin
  const handleBulkUnpin = async () => {
    try {
      await bulkUnpinJournalEntries(Array.from(selectedEntries))
      
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          entries: chat.entries.map(e => 
            selectedEntries.has(e.id) ? { ...e, is_pinned: false } : e
          )
        }))
      )
      setActiveChat((prev) => prev ? {
        ...prev,
        entries: prev.entries.map(e => 
          selectedEntries.has(e.id) ? { ...e, is_pinned: false } : e
        )
      } : null)
      
      setSelectedEntries(new Set())
    } catch (error) {
      console.error('Failed to unpin entries:', error)
      alert('Failed to unpin entries')
    }
  }

  // Handler: Toggle individual pin
  const handleTogglePin = async (entryId: string, currentPinned: boolean) => {
    try {
      await togglePinJournalEntry(entryId, !currentPinned)
      
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          entries: chat.entries.map(e => 
            e.id === entryId ? { ...e, is_pinned: !currentPinned } : e
          )
        }))
      )
      setActiveChat((prev) => prev ? {
        ...prev,
        entries: prev.entries.map(e => 
          e.id === entryId ? { ...e, is_pinned: !currentPinned } : e
        )
      } : null)
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      alert('Failed to toggle pin')
    }
  }

  // Handler: Bulk add tags
  const handleBulkAddTags = () => {
    setShowBulkTagInput(true)
  }

  const handleBulkAddTagsSubmit = async () => {
    if (!bulkTags.trim()) return
    
    try {
      const tags = bulkTags.split(',').map(t => t.trim()).filter(t => t)
      await bulkAddTagsToJournalEntries(Array.from(selectedEntries), tags)
      
      if (activeChat) {
        const entries = await getJournalEntries(activeChat.id)
        const updatedEntries = entries.map((e: any) => ({
          id: e.id,
          content: e.content,
          timestamp: new Date(e.created_at),
          tags: e.tags || [],
          mentions: extractMentions(e.content),
          mentionedClientNames: [],
          is_pinned: e.is_pinned || false,
          is_converted: e.is_converted || false,
          converted_to_content_id: e.converted_to_content_id || null,
        }))
        
        setActiveChat({ ...activeChat, entries: updatedEntries })
        setChats((prev) =>
          prev.map((chat) => chat.id === activeChat.id ? { ...chat, entries: updatedEntries } : chat)
        )
      }
      
      setSelectedEntries(new Set())
      setShowBulkTagInput(false)
      setBulkTags("")
    } catch (error) {
      console.error('Failed to add tags:', error)
      alert('Failed to add tags')
    }
  }

  // Handler: Individual convert to content
  const handleConvertToContent = (entryId: string, content: string) => {
    setEntriesToConvert([entryId])
    setConvertEntryContent(content)
    setConvertDialogOpen(true)
  }

  // Handler: Bulk convert to content
  const handleBulkConvertToContent = () => {
    setEntriesToConvert(Array.from(selectedEntries))
    setConvertEntryContent('')
    setConvertDialogOpen(true)
  }

  // Handler: After successful conversion
  const handleConversionSuccess = async () => {
    if (activeChat) {
      const entries = await getJournalEntries(activeChat.id)
      const updatedEntries = entries.map((e: any) => ({
        id: e.id,
        content: e.content,
        timestamp: new Date(e.created_at),
        tags: e.tags || [],
        mentions: extractMentions(e.content),
        mentionedClientNames: [],
        is_pinned: e.is_pinned || false,
        is_converted: e.is_converted || false,
        converted_to_content_id: e.converted_to_content_id || null,
      }))
      
      setActiveChat({ ...activeChat, entries: updatedEntries })
      setChats((prev) =>
        prev.map((chat) => chat.id === activeChat.id ? { ...chat, entries: updatedEntries } : chat)
      )
    }
    
    setSelectedEntries(new Set())
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
    let html = escapeHtml(content)
    
    mentionedClientNames.forEach(clientName => {
      const escapedName = clientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`@${escapedName}`, 'g')
      html = html.replace(regex, `<span class="text-cyan-400 font-medium">@${escapeHtml(clientName)}</span>`)
    })
    
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

      {/* Sidebar Content - reused for both mobile Sheet and desktop */}
      {(() => {
        const SidebarContent = () => (
          <div className="space-y-6">
            {/* Chats */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Chats</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setShowCreateChatDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1 px-3 pb-3">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setActiveChat(chat)
                        setSidebarOpen(false) // Close sidebar on mobile after selection
                      }}
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
        )

        return (
          <div className="flex gap-6">
            {/* Mobile: Sheet trigger button */}
            <div className="lg:hidden">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open sidebar</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Journal</SheetTitle>
                    <SheetDescription className="sr-only">Journal entries and chats sidebar</SheetDescription>
                  </SheetHeader>
                  <div className="p-4 overflow-y-auto">
                    <SidebarContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop: Always visible sidebar */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <SidebarContent />
            </aside>

            {/* Main Content - takes full width on mobile */}
            <Card className="border-border bg-card flex-1 min-w-0">
              <CardHeader>
                <CardTitle>{activeChat.name}</CardTitle>
                <p className="text-sm text-muted-foreground">Created Dec 20 • {activeChat.entries.length} entries</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Entries */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {activeChat.entries
                .sort((a, b) => {
                  if (a.is_pinned && !b.is_pinned) return -1
                  if (!a.is_pinned && b.is_pinned) return 1
                  return b.timestamp.getTime() - a.timestamp.getTime()
                })
                .map((entry) => (
                <div 
                  key={entry.id} 
                  className={cn(
                    "group relative rounded-lg border bg-background p-4",
                    entry.is_pinned 
                      ? "border-amber-500/50 border-t-2 border-t-amber-500 bg-amber-500/5" 
                      : "border-border"
                  )}
                >
                  {/* Checkbox for bulk selection */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedEntries.has(entry.id)}
                      onCheckedChange={() => handleToggleSelection(entry.id)}
                      className="border-muted-foreground"
                    />
                  </div>
                  
                  {/* Pin button */}
                  <button
                    onClick={() => handleTogglePin(entry.id, entry.is_pinned || false)}
                    className={cn(
                      "absolute top-2 right-20 p-1.5 rounded hover:bg-amber-500/20 transition-opacity z-10",
                      entry.is_pinned ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    )}
                    title={entry.is_pinned ? "Unpin entry" : "Pin entry"}
                  >
                    {entry.is_pinned ? (
                      <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <Pin className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  {/* Convert to Content button */}
                  {!entry.is_converted && (
                    <button
                      onClick={() => handleConvertToContent(entry.id, entry.content)}
                      className="absolute top-2 right-10 p-1.5 rounded hover:bg-green-500/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                      title="Convert to content"
                    >
                      <FileText className="w-4 h-4 text-green-500" />
                    </button>
                  )}
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="absolute top-2 right-2 p-1.5 rounded hover:bg-destructive/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                  
                  <div className="pl-6">
                    <p className="text-xs text-muted-foreground mb-2">
                      {format(entry.timestamp, "MMM d 'at' h:mm a")}
                    </p>
                    <p 
                      className="text-sm text-foreground whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: renderContent(entry.content, entry.mentionedClientNames) }}
                    />
                    
                    {/* Converted to Content Badge */}
                    {entry.is_converted && entry.converted_to_content_id && (
                      <Link
                        href={`/dashboard/content/${entry.converted_to_content_id}`}
                        className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        <span>Converted to Content</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
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
                      <div className="px-3 py-2 border-b border-border bg-muted/50">
                        <span className="text-xs text-muted-foreground">
                          {mentionSearch ? `Searching "${mentionSearch}"` : 'Link to...'}
                        </span>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
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
        )
      })()}

      {/* Create Chat Dialog */}
      <Dialog open={showCreateChatDialog} onOpenChange={setShowCreateChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
            <DialogDescription>
              Choose a chat type and link it to an entity if needed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chat Type</label>
              <Select value={newChatType} onValueChange={(value) => {
                setNewChatType(value as 'general' | 'client' | 'project' | 'content')
                setSelectedEntityId("")
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newChatType !== 'general' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select {newChatType.charAt(0).toUpperCase() + newChatType.slice(1)}
                </label>
                <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${newChatType}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {newChatType === 'client' && clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                    {newChatType === 'project' && projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                        {project.clientName && ` (${project.clientName})`}
                      </SelectItem>
                    ))}
                    {newChatType === 'content' && contentItems.map((content) => (
                      <SelectItem key={content.id} value={content.id}>
                        {content.title}
                        {content.clientName && ` (${content.clientName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateChatDialog(false)
                setNewChatType('general')
                setSelectedEntityId("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChat}
              disabled={creatingChat || (newChatType !== 'general' && !selectedEntityId)}
            >
              {creatingChat ? 'Creating...' : 'Create Chat'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Input Dialog */}
      <Dialog open={showBulkTagInput} onOpenChange={setShowBulkTagInput}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags to Selected Entries</DialogTitle>
            <DialogDescription>
              Enter tags separated by commas (e.g., important, followup, research)
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <input
              type="text"
              value={bulkTags}
              onChange={(e) => setBulkTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBulkAddTagsSubmit()
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkTagInput(false)
                setBulkTags("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkAddTagsSubmit}>
              Add Tags
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Bar */}
      <JournalBulkActionBar
        selectedCount={selectedEntries.size}
        onDelete={handleBulkDelete}
        onPin={handleBulkPin}
        onUnpin={handleBulkUnpin}
        onAddTags={handleBulkAddTags}
        onConvertToContent={handleBulkConvertToContent}
        onCancel={() => setSelectedEntries(new Set())}
        hasPinnedItems={
          activeChat?.entries.some(e => selectedEntries.has(e.id) && e.is_pinned) || false
        }
      />
      
      {/* Convert to Content Dialog */}
      <ConvertToContentDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        entryIds={entriesToConvert}
        entryContent={convertEntryContent}
        onSuccess={handleConversionSuccess}
      />
    </div>
  )
}

