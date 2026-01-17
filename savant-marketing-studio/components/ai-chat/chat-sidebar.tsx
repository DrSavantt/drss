"use client"

import { useState, useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Search, X, Archive, Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { ConversationListItem } from "@/app/actions/chat"

interface ChatSidebarProps {
  conversations: ConversationListItem[]
  currentConversationId?: string
  clients: Array<{ id: string; name: string }>
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onArchiveConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
  onDeleteConversation: (id: string) => void
  onLinkClient: (conversationId: string, clientId: string | null) => void
  onClose: () => void
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  clients,
  onNewChat,
  onSelectConversation,
  onArchiveConversation,
  onRenameConversation,
  onDeleteConversation,
  onLinkClient,
  onClose,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  // Dialog state for rename
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean
    conversationId: string | null
    currentTitle: string
  }>({ open: false, conversationId: null, currentTitle: "" })
  
  // Dialog state for link client
  const [linkClientDialog, setLinkClientDialog] = useState<{
    open: boolean
    conversationId: string | null
  }>({ open: false, conversationId: null })

  // Derive unique clients from conversations for filter dropdown
  const uniqueClients = useMemo(() => {
    const clientMap = new Map<string, string>()
    conversations.forEach(conv => {
      if (conv.clientId && conv.clientName) {
        clientMap.set(conv.clientId, conv.clientName)
      }
    })
    return Array.from(clientMap, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [conversations])

  const filteredConversations = conversations.filter((conv) => {
    // Search filter
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Client filter
    const matchesClient = 
      clientFilter === "all" ||
      (clientFilter === "unassigned" && !conv.clientId) ||
      conv.clientId === clientFilter
    
    return matchesSearch && matchesClient
  })

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <h2 className="font-semibold text-sidebar-foreground">Conversations</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button onClick={onNewChat} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2 px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 bg-muted pl-9 text-sm"
          />
        </div>

        {/* Client Filter */}
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="h-9 w-full bg-muted text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by client" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chats</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {uniqueClients.length > 0 && (
              <>
                <div className="border-t mt-1 pt-1 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Clients
                </div>
                {uniqueClients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        {/* Filter result count */}
        {clientFilter !== "all" && (
          <p className="text-xs text-muted-foreground">
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? "s" : ""}
            {clientFilter === "unassigned" ? " unassigned" : ""}
          </p>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className="relative"
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "flex w-full flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left transition-colors",
                  currentConversationId === conv.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
                )}
              >
                <span
                  className={cn(
                    "line-clamp-1 text-sm font-medium pr-8",
                    currentConversationId === conv.id ? "text-sidebar-foreground" : "text-muted-foreground",
                  )}
                >
                  {conv.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                  </span>
                  {conv.clientName && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                      {conv.clientName}
                    </span>
                  )}
                </div>
              </button>
              
              {/* 3-dot menu - shows on hover */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute right-2 top-2 h-6 w-6 text-muted-foreground transition-opacity",
                      hoveredId === conv.id ? "opacity-100" : "opacity-0"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setRenameDialog({
                        open: true,
                        conversationId: conv.id,
                        currentTitle: conv.title,
                      })
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setLinkClientDialog({
                        open: true,
                        conversationId: conv.id,
                      })
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {conv.clientId ? "Change Client" : "Link Client"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onArchiveConversation(conv.id)
                    }}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm("Permanently delete this conversation? This cannot be undone.")) {
                        onDeleteConversation(conv.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialog.open}
        onOpenChange={(open) => !open && setRenameDialog({ open: false, conversationId: null, currentTitle: "" })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const newTitle = formData.get("title") as string
              if (renameDialog.conversationId && newTitle.trim()) {
                onRenameConversation(renameDialog.conversationId, newTitle.trim())
                setRenameDialog({ open: false, conversationId: null, currentTitle: "" })
              }
            }}
          >
            <Input
              name="title"
              defaultValue={renameDialog.currentTitle}
              placeholder="Conversation title"
              className="mb-4"
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRenameDialog({ open: false, conversationId: null, currentTitle: "" })}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Client Dialog */}
      <Dialog
        open={linkClientDialog.open}
        onOpenChange={(open) => !open && setLinkClientDialog({ open: false, conversationId: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                if (linkClientDialog.conversationId) {
                  onLinkClient(linkClientDialog.conversationId, null)
                  setLinkClientDialog({ open: false, conversationId: null })
                }
              }}
            >
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              Unassigned (No Client)
            </Button>
            {clients.map((client) => (
              <Button
                key={client.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  if (linkClientDialog.conversationId) {
                    onLinkClient(linkClientDialog.conversationId, client.id)
                    setLinkClientDialog({ open: false, conversationId: null })
                  }
                }}
              >
                <Users className="h-4 w-4 mr-2 text-primary" />
                {client.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
