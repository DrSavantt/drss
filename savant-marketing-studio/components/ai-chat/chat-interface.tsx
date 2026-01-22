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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { PanelLeft, ChevronDown, MessageSquare, AlertTriangle, Users, Menu } from "lucide-react"
import { TokenCounter } from "./token-counter"
import {
  createConversation,
  getConversation,
  sendMessage,
  archiveConversation,
  deleteConversation,
  saveMessageToContent,
  summarizeConversation,
  listConversations,
  updateConversation,
  type ConversationListItem,
  type ConversationMessage,
} from "@/app/actions/chat"
import { SaveToLibraryDialog } from "./save-to-library-dialog"
import { toast } from "sonner"

// JournalEntrySummary type (needed for props)
export type JournalEntrySummary = {
  id: string
  title: string | null
  icon?: string | null
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
  models: Array<{ id: string; model_name: string; display_name: string; max_tokens: number | null }>
  initialConversations: ConversationListItem[]
  journalEntries: JournalEntrySummary[]
  initialConversationId?: string | null  // URL param to auto-select a conversation
}

export function ChatInterface({
  clients,
  writingFrameworks,
  projects,
  contentAssets,
  models,
  initialConversations,
  journalEntries,
  initialConversationId = null,
}: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true) // Desktop sidebar
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false) // Mobile sheet
  const [selectedModel, setSelectedModel] = useState(models[0] || { id: "", model_name: "", display_name: "No model", max_tokens: 200000 })
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Token tracking state for live counter
  const [conversationTokens, setConversationTokens] = useState<{
    input: number
    output: number
  }>({ input: 0, output: 0 })
  
  // Summarization state for context rollover
  const [isSummarizing, setIsSummarizing] = useState(false)
  
  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [messageToSave, setMessageToSave] = useState<ConversationMessage | null>(null)
  
  // Track last mentioned project for auto-fill on save
  const [lastMentionedProject, setLastMentionedProject] = useState<{
    id: string
    clientId: string | null
  } | null>(null)
  
  // Track if we just created a conversation (to avoid clearing lastMentionedProject)
  const justCreatedConversation = useRef(false)
  
  // State for "link to client" suggestion when @client is mentioned in unassigned chat
  const [pendingClientLink, setPendingClientLink] = useState<{
    clientId: string
    clientName: string
  } | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load initial conversation if provided via URL param
  useEffect(() => {
    if (initialConversationId && messages.length === 0) {
      handleSelectConversation(initialConversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId])

  // Clear state when switching conversations (but not when creating new)
  useEffect(() => {
    if (justCreatedConversation.current) {
      // Don't clear - we just created this conversation from a message with @project
      justCreatedConversation.current = false
      return
    }
    setLastMentionedProject(null)
    setPendingClientLink(null)  // Clear any pending link suggestion
  }, [currentConversationId])

  const handleNewChat = () => {
    setCurrentConversationId(null)
    setMessages([])
    // Reset token counter for new conversation
    setConversationTokens({ input: 0, output: 0 })
  }

  const handleSelectConversation = async (id: string) => {
    setCurrentConversationId(id)
    setMobileSheetOpen(false) // Close mobile sheet when selecting a conversation
    
    const result = await getConversation(id)
    if (result.success && result.data) {
      setMessages(result.data.messages)
      // Update token counter with conversation totals
      setConversationTokens({
        input: result.data.conversation.total_input_tokens || 0,
        output: result.data.conversation.total_output_tokens || 0,
      })
    }
  }

  const handleArchiveConversation = async (id: string) => {
    const result = await archiveConversation(id)
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (currentConversationId === id) {
        handleNewChat()
      }
      toast.success("Conversation archived")
    } else {
      toast.error("Failed to archive conversation")
    }
  }

  const handleRenameConversation = async (id: string, newTitle: string) => {
    const result = await updateConversation(id, { title: newTitle })
    if (result.success) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      )
      toast.success("Conversation renamed")
    } else {
      toast.error("Failed to rename conversation")
    }
  }

  const handleDeleteConversation = async (id: string) => {
    const result = await deleteConversation(id)
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (currentConversationId === id) {
        setCurrentConversationId(null)
        setMessages([])
        setConversationTokens({ input: 0, output: 0 })
      }
      toast.success("Conversation deleted")
    } else {
      toast.error("Failed to delete conversation")
    }
  }

  const handleLinkClientToConversation = async (conversationId: string, clientId: string | null) => {
    const result = await updateConversation(conversationId, { clientId })
    if (result.success) {
      // Find client name from clients list
      const clientName = clientId ? clients.find((c) => c.id === clientId)?.name || null : null
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, clientId, clientName } : c
        )
      )
      toast.success(clientId ? "Client linked" : "Client unlinked")
    } else {
      toast.error("Failed to update conversation")
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
        // Mark that we're creating a new conversation (don't clear lastMentionedProject)
        justCreatedConversation.current = true
        setCurrentConversationId(conversationId)

        // Add to conversations list
        const newListItem: ConversationListItem = {
          id: conversationId,
          title: createResult.data.title,
          clientId: createResult.data.client_id,
          clientName: lookupClientName,
          messageCount: 0,
          totalCost: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
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
        // Update token counter with new totals (trigger auto-updates these in DB)
        setConversationTokens({
          input: refreshResult.data.conversation.total_input_tokens || 0,
          output: refreshResult.data.conversation.total_output_tokens || 0,
        })
      }
      
      // Check if we should suggest linking to a mentioned client
      // Only if message sent successfully AND we have context mentions
      if (context.length > 0) {
        const clientMention = context.find(c => c.type === 'client')
        if (clientMention) {
          // Get current conversation's client (use refreshed data or fall back to state)
          const currentConv = conversations.find(c => c.id === conversationId)
          const currentClientId = currentConv?.clientId || null
          
          // If mentioned client is different from conversation's client, suggest linking
          if (clientMention.id !== currentClientId) {
            setPendingClientLink({
              clientId: clientMention.id,
              clientName: clientMention.name,
            })
          }
        }
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

  // Handle "Summarize & Continue" - creates summary, archives old chat, starts new one
  const handleSummarizeAndContinue = async () => {
    if (!currentConversationId || isSummarizing) return
    
    setIsSummarizing(true)
    
    try {
      // Get current conversation details
      const currentConv = conversations.find(c => c.id === currentConversationId)
      
      // Step 1: Summarize current conversation
      const summaryResult = await summarizeConversation(currentConversationId)
      if (!summaryResult.success || !summaryResult.data?.summary) {
        toast.error(summaryResult.error || 'Failed to summarize conversation')
        return
      }
      
      // Step 2: Create new conversation with summary as system prompt
      const newConvResult = await createConversation({
        clientId: currentConv?.clientId || undefined,
        title: `Continued: ${currentConv?.title || 'Chat'}`,
        systemPrompt: summaryResult.data.summary,
      })
      
      if (!newConvResult.success || !newConvResult.data) {
        toast.error('Failed to create new conversation')
        return
      }
      
      // Step 3: Archive the old conversation
      await archiveConversation(currentConversationId)
      
      // Step 4: Switch to new conversation
      setCurrentConversationId(newConvResult.data.id)
      setMessages([])
      setConversationTokens({ input: 0, output: 0 })
      
      // Step 5: Refresh conversation list
      const listResult = await listConversations({ status: 'active' })
      if (listResult.success && listResult.data) {
        setConversations(listResult.data)
      }
      
      toast.success('Conversation summarized and continued in new chat')
    } catch (error) {
      console.error('Error in summarize and continue:', error)
      toast.error('An error occurred while summarizing')
    } finally {
      setIsSummarizing(false)
    }
  }

  // Handle linking conversation to a mentioned client
  const handleLinkToClient = async () => {
    if (!currentConversationId || !pendingClientLink) return
    
    const result = await updateConversation(currentConversationId, {
      clientId: pendingClientLink.clientId,
    })
    
    if (result.success) {
      // Update conversation in local state with new client info
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId
          ? { ...conv, clientId: pendingClientLink.clientId, clientName: pendingClientLink.clientName }
          : conv
      ))
      toast.success(`Chat linked to ${pendingClientLink.clientName}`)
    } else {
      toast.error('Failed to link chat')
    }
    
    setPendingClientLink(null)
  }

  const handleDismissLink = () => {
    setPendingClientLink(null)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Mobile: Sheet for sidebar */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="left" className="w-[300px] p-0 md:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Conversations</SheetTitle>
            <SheetDescription>Select or manage AI chat conversations</SheetDescription>
          </SheetHeader>
          <ChatSidebar
            conversations={conversations}
            currentConversationId={currentConversationId || undefined}
            clients={clients}
            onNewChat={() => {
              handleNewChat()
              setMobileSheetOpen(false)
            }}
            onSelectConversation={handleSelectConversation}
            onArchiveConversation={handleArchiveConversation}
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            onLinkClient={handleLinkClientToConversation}
            onClose={() => setMobileSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop: Regular Sidebar - hidden on mobile, uses wrapper for responsive hiding */}
      <aside className="hidden md:flex h-full flex-shrink-0">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={false}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full overflow-hidden border-r border-border"
              style={{ width: 280 }}
            >
              <ChatSidebar
                conversations={conversations}
                currentConversationId={currentConversationId || undefined}
                clients={clients}
                onNewChat={handleNewChat}
                onSelectConversation={handleSelectConversation}
                onArchiveConversation={handleArchiveConversation}
                onRenameConversation={handleRenameConversation}
                onDeleteConversation={handleDeleteConversation}
                onLinkClient={handleLinkClientToConversation}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            {/* Mobile: Menu button to open sheet */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSheetOpen(true)}
              className="md:hidden min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Desktop: Show panel toggle when sidebar is closed */}
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="hidden md:flex text-muted-foreground hover:text-foreground"
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
          <TokenCounter 
            inputTokens={conversationTokens.input}
            outputTokens={conversationTokens.output}
            maxTokens={selectedModel?.max_tokens || 200000}
          />
        </header>

        {/* Token Limit Warning Banner with Summarize & Continue */}
        {(() => {
          const total = conversationTokens.input + conversationTokens.output
          const maxTokens = selectedModel?.max_tokens || 200000
          const percentage = (total / maxTokens) * 100
          
          // Critical: ≥95% - Red banner with urgent action
          if (percentage >= 95) {
            return (
              <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Near context limit — summarize to continue</span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleSummarizeAndContinue}
                  disabled={isSummarizing || !currentConversationId}
                  className="flex-shrink-0"
                >
                  {isSummarizing ? 'Summarizing...' : 'Summarize & Continue'}
                </Button>
              </div>
            )
          }
          // Warning: ≥70% - Yellow banner with suggestion
          if (percentage >= 70) {
            return (
              <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Context usage at {Math.round(percentage)}% — consider summarizing</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSummarizeAndContinue}
                  disabled={isSummarizing || !currentConversationId}
                  className="flex-shrink-0 border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10 dark:text-yellow-500"
                >
                  {isSummarizing ? 'Summarizing...' : 'Summarize & Continue'}
                </Button>
              </div>
            )
          }
          return null
        })()}

        {/* Link to Client Suggestion Banner */}
        {pendingClientLink && (
          <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Link this chat to <strong>{pendingClientLink.clientName}</strong>?</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismissLink}
                className="text-muted-foreground"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={handleLinkToClient}
              >
                Link
              </Button>
            </div>
          </div>
        )}

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

          {/* Chat Input - sticky bottom with safe area for iOS + space for bottom nav on mobile */}
          <div className="sticky bottom-0 border-t border-border bg-background p-4 pb-[calc(4rem+max(1rem,env(safe-area-inset-bottom)))] md:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-3xl">
              <ChatInput
                onSend={handleSendMessage}
                disabled={isGenerating}
                clients={clients}
                projects={projects}
                contentAssets={contentAssets}
                journalEntries={journalEntries}
                writingFrameworks={writingFrameworks}
                currentTokens={conversationTokens.input + conversationTokens.output}
                maxTokens={selectedModel?.max_tokens || 200000}
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
