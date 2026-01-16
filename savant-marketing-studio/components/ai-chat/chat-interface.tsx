"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ChatSidebar } from "./chat-sidebar"
import { ChatInput } from "./chat-input"
import type { ContextItem } from "./context-picker-modal"
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
import { SaveToLibraryDialog } from "./save-to-library-dialog"
import { toast } from "sonner"

// JournalEntrySummary type (needed for props)
export type JournalEntrySummary = {
  id: string
  title: string | null
  content: string
  tags: string[] | null
  created_at: string
  mentionedClients?: Array<{ id: string; name: string }>
  mentionedProjects?: Array<{ id: string; name: string }>
  mentionedContent?: Array<{ id: string; name: string }>
}

export interface ChatInterfaceProps {
  clients: Array<{ id: string; name: string }>
  writingFrameworks: Array<{ id: string; name: string; category: string }>
  projects: Array<{ id: string; name: string; description: string | null; clientId: string | null; clientName: string | null }>
  contentAssets: Array<{ id: string; title: string; content: string | null; contentType: string | null; clientId: string | null; clientName: string | null }>
  models: Array<{ id: string; model_name: string; display_name: string }>
  initialConversations: ConversationListItem[]
  journalEntries: JournalEntrySummary[]
}

export function ChatInterface({
  clients,
  writingFrameworks,
  projects,
  contentAssets,
  models,
  initialConversations,
  journalEntries,
}: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedModel, setSelectedModel] = useState(models[0] || { id: "", model_name: "", display_name: "No model" })
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [messageToSave, setMessageToSave] = useState<ConversationMessage | null>(null)
  
  // Track last mentioned project for auto-fill on save
  const [lastMentionedProject, setLastMentionedProject] = useState<{
    id: string
    clientId: string | null
  } | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Clear last mentioned project when conversation changes
  useEffect(() => {
    setLastMentionedProject(null)
  }, [currentConversationId])

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
    context: ContextItem[],
    useExtendedThinking: boolean = false,
  ) => {
    // Extract project mention for auto-fill on save dialog
    const projectMention = context.find(c => c.type === 'project')
    if (projectMention) {
      const project = projects.find(p => p.id === projectMention.id)
      if (project) {
        setLastMentionedProject({
          id: project.id,
          clientId: project.clientId
        })
      }
    } else {
      // Clear if no project mentioned - each message is independent
      setLastMentionedProject(null)
    }
    
    // Convert ContextItem[] to mentions format for backward compatibility with sendMessage action
    const mentions = context.map(item => ({
      type: item.type === "capture" ? "capture" as const : 
            item.type === "framework" ? "writing-framework" as const :
            item.type === "content" ? "content" as const :
            item.type as "client" | "project",
      name: item.name,
      id: item.id,
    }))

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
        const contentMention = mentions.find((m) => m.type === "content")
        const projectMention = mentions.find((m) => m.type === "project")
        const writingFrameworkMentions = mentions.filter((m) => m.type === "writing-framework")
        const resolvedClientId = clientMention?.id || undefined
        const resolvedClientName = clientMention?.name || null

        // For content and project, we need to look up client from props
        let lookupClientId = resolvedClientId
        let lookupClientName = resolvedClientName
        
        if (!lookupClientId && contentMention) {
          const asset = contentAssets.find(a => a.id === contentMention.id)
          if (asset?.clientId) {
            lookupClientId = asset.clientId
            lookupClientName = asset.clientName || null
          }
        }
        if (!lookupClientId && projectMention) {
          const project = projects.find(p => p.id === projectMention.id)
          if (project?.clientId) {
            lookupClientId = project.clientId
            lookupClientName = project.clientName || null
          }
        }

        const createResult = await createConversation({
          clientId: lookupClientId,
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
          clientName: lookupClientName,
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
        mentions,
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

  // Get current conversation details
  const currentConversation = currentConversationId 
    ? conversations.find(c => c.id === currentConversationId) 
    : null

  // Open save dialog instead of direct save
  const handleSaveToLibrary = (message: ConversationMessage): Promise<boolean> => {
    setMessageToSave(message)
    setSaveDialogOpen(true)
    return Promise.resolve(true) // Dialog will handle the actual save
  }

  // Actual save handler called from dialog
  const handleConfirmSave = async (data: { title: string; projectId: string | null }) => {
    if (!messageToSave || !currentConversation) return

    const result = await saveMessageToContent({
      executionId: messageToSave.id,
      projectId: data.projectId || undefined,
      title: data.title,
    })

    if (result.success) {
      toast.success('Saved to content library')
      setMessageToSave(null)
    } else {
      toast.error(result.error || 'Failed to save content')
      throw new Error(result.error) // Re-throw so dialog knows it failed
    }
  }

  const handleRegenerateMessage = (messageId: string) => {
    // TODO: Implement message regeneration
    void messageId; // Placeholder until implemented
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
                  Type <span className="font-mono text-primary">@</span> or click the{" "}
                  <span className="font-mono text-primary">+</span> button to add clients, projects, content, captures, or frameworks as context.
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
                projects={projects}
                contentAssets={contentAssets}
                journalEntries={journalEntries}
                writingFrameworks={writingFrameworks}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save to Library Dialog */}
      {messageToSave && currentConversation && (
        <SaveToLibraryDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={handleConfirmSave}
          clientId={lastMentionedProject?.clientId || currentConversation.clientId}
          defaultProjectId={lastMentionedProject?.id || null}
          defaultTitle={`Chat Response - ${currentConversation.title || 'Untitled'}`}
        />
      )}
    </div>
  )
}
