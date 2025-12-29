"use client"

import type React from "react"
import { useState } from "react"
import { Plus, Hash, AtSign, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface JournalEntry {
  id: string
  content: string
  timestamp: Date
  tags: string[]
  mentions: string[]
}

interface Chat {
  id: string
  name: string
  entries: JournalEntry[]
}

const mockChats: Chat[] = [
  {
    id: "1",
    name: "Marketing Ideas",
    entries: [
      {
        id: "e1",
        content:
          "Just had a great idea for @AcmeCorp's email sequence. Should use the #AIDA framework with a twist on the desire section.",
        timestamp: new Date("2024-12-22T14:30:00"),
        tags: ["AIDA"],
        mentions: ["AcmeCorp"],
      },
      {
        id: "e2",
        content:
          "Meeting notes from call with TechStart. They want to focus on #PAS for their landing page. Budget is $5k/mo.",
        timestamp: new Date("2024-12-22T13:15:00"),
        tags: ["PAS"],
        mentions: [],
      },
      {
        id: "e3",
        content:
          "Need to research more about B2B email sequences. Check out what @GrowthLabs did last quarter - it worked well.",
        timestamp: new Date("2024-12-21T10:00:00"),
        tags: [],
        mentions: ["GrowthLabs"],
      },
    ],
  },
  {
    id: "2",
    name: "Client Notes",
    entries: [
      {
        id: "e4",
        content: "@NewCo prefers short, punchy copy. Keep sentences under 15 words. #voice",
        timestamp: new Date("2024-12-20T16:45:00"),
        tags: ["voice"],
        mentions: ["NewCo"],
      },
    ],
  },
  {
    id: "3",
    name: "Random Thoughts",
    entries: [],
  },
]

const allTags = ["AIDA", "PAS", "voice", "ideas", "research", "followup"]

export function Journal() {
  const [chats, setChats] = useState<Chat[]>(mockChats)
  const [activeChat, setActiveChat] = useState(mockChats[0])
  const [newEntry, setNewEntry] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.trim()) return

    const entry: JournalEntry = {
      id: `e${Date.now()}`,
      content: newEntry,
      timestamp: new Date(),
      tags: newEntry.match(/#(\w+)/g)?.map((t) => t.slice(1)) || [],
      mentions: newEntry.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [],
    }

    setChats((prev) =>
      prev.map((chat) => (chat.id === activeChat.id ? { ...chat, entries: [entry, ...chat.entries] } : chat)),
    )
    setActiveChat((prev) => ({ ...prev, entries: [entry, ...prev.entries] }))
    setNewEntry("")
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
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {entry.content.split(/(@\w+|#\w+)/g).map((part, i) => {
                      if (part.startsWith("@")) {
                        return (
                          <span key={i} className="text-info font-medium">
                            {part}
                          </span>
                        )
                      }
                      if (part.startsWith("#")) {
                        return (
                          <span key={i} className="text-primary font-medium">
                            {part}
                          </span>
                        )
                      }
                      return part
                    })}
                  </p>
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
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Type a new entry... Use @ to mention clients, # to add tags"
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button type="button" className="p-1 text-muted-foreground hover:text-foreground">
                    <AtSign className="h-4 w-4" />
                  </button>
                  <button type="button" className="p-1 text-muted-foreground hover:text-foreground">
                    <Hash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={!newEntry.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
