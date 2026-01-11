"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ChatSidebar } from "./chat-sidebar"
import { ChatInput } from "./chat-input"
import { MessageThread } from "./message-thread"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PanelLeft, ChevronDown, MessageSquare } from "lucide-react"

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  mentions?: { type: "client" | "framework"; name: string; id: string }[]
  timestamp: Date
}

export type Conversation = {
  id: string
  title: string
  clientName?: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

const models = [
  { id: "sonnet-4.5", name: "Sonnet 4.5", description: "Fast & capable" },
  { id: "opus-4.5", name: "Opus 4.5", description: "Most powerful" },
  { id: "haiku-4.5", name: "Haiku 4.5", description: "Fastest" },
  { id: "gemini-flash", name: "Gemini Flash", description: "Google's fast model" },
  { id: "gemini-pro", name: "Gemini Pro", description: "Google's advanced model" },
]

const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Email campaign ideas for TechStart",
    clientName: "TechStart Inc",
    messages: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Landing page copy review",
    messages: [],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "Social media strategy for Q1",
    clientName: "Bloom Wellness",
    messages: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
]

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedModel, setSelectedModel] = useState(models[0])
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleNewChat = () => {
    setCurrentConversation(null)
    setMessages([])
  }

  const handleSelectConversation = (conv: Conversation) => {
    setCurrentConversation(conv)
    setMessages(conv.messages)
  }

  const handleSendMessage = async (
    content: string,
    mentions: { type: "client" | "framework"; name: string; id: string }[],
  ) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      mentions,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsGenerating(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'll help you with that! ${mentions.length > 0 ? `I see you've referenced ${mentions.map((m) => m.name).join(", ")}. ` : ""}Here's my response based on your request:\n\n**Key Points:**\n- First, let's consider the main objectives\n- Then, we'll outline the strategy\n- Finally, we'll create actionable items\n\nWould you like me to elaborate on any of these points?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsGenerating(false)

      // Update or create conversation
      if (!currentConversation) {
        const newConv: Conversation = {
          id: Date.now().toString(),
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          clientName: mentions.find((m) => m.type === "client")?.name,
          messages: [userMessage, aiMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setConversations((prev) => [newConv, ...prev])
        setCurrentConversation(newConv)
      }
    }, 1500)
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleSaveToLibrary = (message: Message) => {
    // In real app, this would save to content library
    console.log("Saving to library:", message)
  }

  const handleRegenerateMessage = (messageId: string) => {
    // In real app, this would regenerate the message
    console.log("Regenerating message:", messageId)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full overflow-hidden border-r border-border"
          >
            <ChatSidebar
              conversations={conversations}
              currentConversation={currentConversation}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-sm font-medium">
                {selectedModel.name}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={cn("flex flex-col items-start gap-0.5", selectedModel.id === model.id && "bg-accent")}
                >
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="w-10" /> {/* Spacer for balance */}
        </header>

        {/* Chat Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {messages.length === 0 ? (
            // Empty State
            <div className="flex flex-1 flex-col items-center justify-center px-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">Start a conversation</h2>
                <p className="max-w-sm text-muted-foreground">
                  Use <span className="font-mono text-primary">@client</span> or{" "}
                  <span className="font-mono text-primary">@framework</span> to add context
                </p>
              </div>
            </div>
          ) : (
            // Message Thread
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-4 py-6">
                <MessageThread
                  messages={messages}
                  isGenerating={isGenerating}
                  onCopy={handleCopyMessage}
                  onSave={handleSaveToLibrary}
                  onRegenerate={handleRegenerateMessage}
                />
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="border-t border-border bg-background p-4">
            <div className="mx-auto max-w-3xl">
              <ChatInput onSend={handleSendMessage} disabled={isGenerating} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
