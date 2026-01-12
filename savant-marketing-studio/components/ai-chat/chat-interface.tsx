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
import {
  createConversation,
  getConversation,
  sendMessage,
  archiveConversation,
  saveMessageToContent,
  type ConversationListItem,
  type ConversationMessage,
} from "@/app/actions/chat"

export interface ChatInterfaceProps {
  clients: Array<{ id: string; name: string }>
  contentTypes: Array<{ id: string; name: string; category: string }>
  writingFrameworks: Array<{ id: string; name: string; category: string }>
  models: Array<{ id: string; model_name: string; display_name: string }>
  initialConversations: ConversationListItem[]
}

export function ChatInterface({
  clients,
  contentTypes,
  writingFrameworks,
  models,
  initialConversations,
}: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedModel, setSelectedModel] = useState(models[0] || { id: "", model_name: "", display_name: "No model" })
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleNewChat = () => {
    setCurrentConversationId(null)
    setMessages([])
  }

  const handleSelectConversation = async (id: string) => {
    setCurrentConversationId(id)
    
    const result = await getConversation(id)
    if (result.success && result.data) {
      setMessages(result.data.messages)
    }
  }

  const handleArchiveConversation = async (id: string) => {
    const result = await archiveConversation(id)
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (currentConversationId === id) {
        handleNewChat()
      }
    }
  }

  const handleSendMessage = async (
    content: string,
    mentions: { type: "client" | "content-type" | "writing-framework"; name: string; id: string }[],
    useExtendedThinking: boolean = false,
  ) => {
    // Create optimistic user message for immediate display
    const optimisticId = `temp-${Date.now()}`
    const optimisticUserMessage: ConversationMessage = {
      id: optimisticId,
      conversationId: currentConversationId || '',
      messageRole: 'user',
      content: content,
      inputTokens: null,
      outputTokens: null,
      totalCostUsd: null,
      modelId: selectedModel.model_name,
      createdAt: new Date().toISOString(),
    }

    // Add optimistic message to state immediately
    setMessages(prev => [...prev, optimisticUserMessage])

    // Then start loading state
    setIsGenerating(true)

    try {
      let conversationId = currentConversationId

      // If no current conversation, create one
      if (!conversationId) {
        const clientMention = mentions.find((m) => m.type === "client")
        const contentTypeMention = mentions.find((m) => m.type === "content-type")
        const writingFrameworkMentions = mentions.filter((m) => m.type === "writing-framework")

        const createResult = await createConversation({
          clientId: clientMention?.id,
          contentTypeId: contentTypeMention?.id,
          writingFrameworkIds: writingFrameworkMentions.length > 0 
            ? writingFrameworkMentions.map((m) => m.id) 
            : undefined,
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        })

        if (!createResult.success || !createResult.data) {
          console.error("Failed to create conversation:", createResult.error)
          // Remove optimistic message on error
          setMessages(prev => prev.filter(m => m.id !== optimisticId))
          setIsGenerating(false)
          return
        }

        conversationId = createResult.data.id
        setCurrentConversationId(conversationId)

        // Add to conversations list
        const newListItem: ConversationListItem = {
          id: conversationId,
          title: createResult.data.title,
          clientId: createResult.data.client_id,
          clientName: clientMention?.name || null,
          messageCount: 0,
          totalCost: 0,
          qualityRating: null,
          status: "active",
          createdAt: createResult.data.created_at || new Date().toISOString(),
          updatedAt: createResult.data.updated_at || new Date().toISOString(),
        }
        setConversations((prev) => [newListItem, ...prev])
      }

      // Send the message
      const sendResult = await sendMessage({
        conversationId,
        content,
        modelId: selectedModel.model_name,
        useExtendedThinking,
      })

      if (!sendResult.success) {
        console.error("Failed to send message:", sendResult.error)
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        setIsGenerating(false)
        return
      }

      // Refresh conversation to get updated messages (replaces optimistic with real data)
      const refreshResult = await getConversation(conversationId)
      if (refreshResult.success && refreshResult.data) {
        setMessages(refreshResult.data.messages)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleSaveToLibrary = async (message: ConversationMessage): Promise<boolean> => {
    const result = await saveMessageToContent({ executionId: message.id })
    return result.success
  }

  const handleRegenerateMessage = (messageId: string) => {
    // In real app, this would regenerate the message
    console.log("Regenerating message:", messageId)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
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
              currentConversationId={currentConversationId || undefined}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onArchiveConversation={handleArchiveConversation}
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
                {selectedModel.display_name}
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
                  <span className="font-medium">{model.display_name}</span>
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
                  Use <span className="font-mono text-primary">@client</span>,{" "}
                  <span className="font-mono text-primary">@content-type</span>, or{" "}
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
              <ChatInput
                onSend={handleSendMessage}
                disabled={isGenerating}
                clients={clients}
                contentTypes={contentTypes}
                writingFrameworks={writingFrameworks}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
