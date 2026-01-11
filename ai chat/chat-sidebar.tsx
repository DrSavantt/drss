"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, X } from "lucide-react"
import type { Conversation } from "./chat-interface"

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversation: Conversation | null
  onNewChat: () => void
  onSelectConversation: (conversation: Conversation) => void
  onClose: () => void
}

export function ChatSidebar({
  conversations,
  currentConversation,
  onNewChat,
  onSelectConversation,
  onClose,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 bg-muted pl-9 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={cn(
                "flex w-full flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left transition-colors",
                currentConversation?.id === conv.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
              )}
            >
              <span
                className={cn(
                  "line-clamp-1 text-sm font-medium",
                  currentConversation?.id === conv.id ? "text-sidebar-foreground" : "text-muted-foreground",
                )}
              >
                {conv.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(conv.updatedAt, { addSuffix: true })}
                </span>
                {conv.clientName && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {conv.clientName}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
