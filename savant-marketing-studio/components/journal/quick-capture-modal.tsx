"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap, Loader2, Users, FolderKanban, FileText, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MentionPopover, 
  type MentionClient, 
  type MentionProject, 
  type MentionContent, 
  type MentionJournalPage 
} from "@/components/journal/mention-popover"
import { useMentionDetection, type CursorPosition } from "@/components/journal/use-mention-detection"
import { getClients } from "@/app/actions/clients"
import { getProjects } from "@/app/actions/projects"
import { getAllContentAssets } from "@/app/actions/content"
import { getPageTree } from "@/app/actions/journal-pages"
import { createJournalEntry, getOrCreateInbox } from "@/app/actions/journal"
import type { JournalEntry } from "@/types/journal"

// =============================================================================
// Types
// =============================================================================

interface LinkedEntity {
  id: string
  name: string
  type: "client" | "project" | "content" | "page"
}

export interface QuickCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (entry: JournalEntry) => void
  defaultMentions?: {
    clientId?: string
    projectId?: string
    contentId?: string
    pageId?: string
  }
}

// =============================================================================
// Component
// =============================================================================

export function QuickCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMentions,
}: QuickCaptureModalProps) {
  // Form state
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>([])
  
  // Mention popover state
  const [showMentionPopover, setShowMentionPopover] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ top: 0, left: 0 })
  
  // Data state
  const [clients, setClients] = useState<MentionClient[]>([])
  const [projects, setProjects] = useState<MentionProject[]>([])
  const [contentItems, setContentItems] = useState<MentionContent[]>([])
  const [journalPages, setJournalPages] = useState<MentionJournalPage[]>([])
  const [inboxId, setInboxId] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Use mention detection hook
  const {
    handleKeyDown: mentionHandleKeyDown,
    handleChange: mentionHandleChange,
    insertMention,
    getMentionedIds,
    clearMentions,
    isMentionActive,
  } = useMentionDetection({
    inputRef: textareaRef,
    getValue: () => content,
    setValue: setContent,
    onMentionTrigger: (search, position) => {
      setMentionSearch(search)
      setCursorPosition(position)
      setShowMentionPopover(true)
    },
    onMentionClose: () => {
      setShowMentionPopover(false)
      setMentionSearch("")
    },
  })

  // ==========================================================================
  // Data Fetching
  // ==========================================================================

  useEffect(() => {
    if (isOpen && !dataLoaded) {
      loadData()
    }
  }, [isOpen, dataLoaded])

  const loadData = async () => {
    try {
      const [
        clientsData,
        projectsData,
        contentData,
        pagesData,
        inbox
      ] = await Promise.all([
        getClients(),
        getProjects(),
        getAllContentAssets(),
        getPageTree(),
        getOrCreateInbox()
      ])

      setClients(
        (clientsData || []).map((c: any) => ({
          id: c.id,
          name: c.name,
        }))
      )

      setProjects(
        (projectsData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          client_id: p.client_id,
          clientName: p.clients?.name,
        }))
      )

      setContentItems(
        (contentData || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          clientName: c.clients?.name,
        }))
      )

      // Flatten the page tree for mentions
      const flattenPages = (nodes: any[]): MentionJournalPage[] => {
        const result: MentionJournalPage[] = []
        const traverse = (items: any[]) => {
          for (const item of items) {
            result.push({
              id: item.id,
              title: item.title,
              icon: item.icon,
            })
            if (item.children?.length > 0) {
              traverse(item.children)
            }
          }
        }
        traverse(nodes)
        return result
      }

      setJournalPages(flattenPages(pagesData || []))
      setInboxId(inbox)
      setDataLoaded(true)
    } catch (error) {
      console.error("Failed to load data for quick capture:", error)
      toast.error("Failed to load data")
    }
  }

  // ==========================================================================
  // Handle Default Mentions
  // ==========================================================================

  useEffect(() => {
    if (isOpen && dataLoaded && defaultMentions) {
      const newEntities: LinkedEntity[] = []

      if (defaultMentions.clientId) {
        const client = clients.find(c => c.id === defaultMentions.clientId)
        if (client) {
          newEntities.push({ id: client.id, name: client.name, type: "client" })
        }
      }

      if (defaultMentions.projectId) {
        const project = projects.find(p => p.id === defaultMentions.projectId)
        if (project) {
          newEntities.push({ id: project.id, name: project.name, type: "project" })
        }
      }

      if (defaultMentions.contentId) {
        const contentItem = contentItems.find(c => c.id === defaultMentions.contentId)
        if (contentItem) {
          newEntities.push({ id: contentItem.id, name: contentItem.title, type: "content" })
        }
      }

      if (defaultMentions.pageId) {
        const page = journalPages.find(p => p.id === defaultMentions.pageId)
        if (page) {
          newEntities.push({ id: page.id, name: page.title, type: "page" })
        }
      }

      if (newEntities.length > 0) {
        setLinkedEntities(newEntities)
      }
    }
  }, [isOpen, dataLoaded, defaultMentions, clients, projects, contentItems, journalPages])

  // ==========================================================================
  // Auto-focus
  // ==========================================================================

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // ==========================================================================
  // Reset on close
  // ==========================================================================

  useEffect(() => {
    if (!isOpen) {
      setContent("")
      setLinkedEntities([])
      clearMentions()
      setShowMentionPopover(false)
      setMentionSearch("")
    }
  }, [isOpen, clearMentions])

  // ==========================================================================
  // Mention Handlers
  // ==========================================================================

  const handleSelectClient = useCallback((client: MentionClient) => {
    insertMention("client", { id: client.id, name: client.name })
    setLinkedEntities(prev => {
      if (prev.some(e => e.id === client.id && e.type === "client")) return prev
      return [...prev, { id: client.id, name: client.name, type: "client" }]
    })
    setShowMentionPopover(false)
  }, [insertMention])

  const handleSelectProject = useCallback((project: MentionProject) => {
    insertMention("project", { id: project.id, name: project.name })
    setLinkedEntities(prev => {
      if (prev.some(e => e.id === project.id && e.type === "project")) return prev
      return [...prev, { id: project.id, name: project.name, type: "project" }]
    })
    setShowMentionPopover(false)
  }, [insertMention])

  const handleSelectContent = useCallback((contentItem: MentionContent) => {
    insertMention("content", { id: contentItem.id, name: contentItem.title })
    setLinkedEntities(prev => {
      if (prev.some(e => e.id === contentItem.id && e.type === "content")) return prev
      return [...prev, { id: contentItem.id, name: contentItem.title, type: "content" }]
    })
    setShowMentionPopover(false)
  }, [insertMention])

  const handleSelectPage = useCallback((page: MentionJournalPage) => {
    insertMention("page", { id: page.id, name: page.title })
    setLinkedEntities(prev => {
      if (prev.some(e => e.id === page.id && e.type === "page")) return prev
      return [...prev, { id: page.id, name: page.title, type: "page" }]
    })
    setShowMentionPopover(false)
  }, [insertMention])

  const removeLinkedEntity = useCallback((id: string) => {
    setLinkedEntities(prev => prev.filter(e => e.id !== id))
  }, [])

  // ==========================================================================
  // Keyboard Handling
  // ==========================================================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Let mention hook handle its keys first
    mentionHandleKeyDown(e)

    // Enter to submit (when popover is closed)
    if (e.key === "Enter" && !e.shiftKey && !showMentionPopover && !isMentionActive) {
      e.preventDefault()
      handleSubmit()
    }

    // Escape to close modal (when popover is closed)
    if (e.key === "Escape" && !showMentionPopover && !isMentionActive) {
      e.preventDefault()
      onClose()
    }
  }, [mentionHandleKeyDown, showMentionPopover, isMentionActive, onClose])

  // Global escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showMentionPopover && !isMentionActive) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [isOpen, showMentionPopover, isMentionActive, onClose])

  // ==========================================================================
  // Submit Handler
  // ==========================================================================

  const handleSubmit = async () => {
    if (!content.trim() || !inboxId || submitting) return

    setSubmitting(true)

    try {
      // Parse tags from content
      const tagMatches = content.match(/#(\w+)/g)
      const tags = tagMatches ? tagMatches.map(t => t.slice(1)) : []

      // Get mentioned IDs from hook
      const mentionIds = getMentionedIds()

      // Also include manually linked entities (from defaultMentions or chip removal/re-add)
      const clientIds = Array.from(new Set([
        ...mentionIds.clientIds,
        ...linkedEntities.filter(e => e.type === "client").map(e => e.id)
      ]))

      const projectIds = Array.from(new Set([
        ...mentionIds.projectIds,
        ...linkedEntities.filter(e => e.type === "project").map(e => e.id)
      ]))

      const contentIds = Array.from(new Set([
        ...mentionIds.contentIds,
        ...linkedEntities.filter(e => e.type === "content").map(e => e.id)
      ]))

      const pageIds = Array.from(new Set([
        ...mentionIds.pageIds,
        ...linkedEntities.filter(e => e.type === "page").map(e => e.id)
      ]))

      // Create entry via server action
      const result = await createJournalEntry(
        content.trim(),
        inboxId,
        clientIds,
        projectIds,
        contentIds,
        tags,
        pageIds
      )

      if (!result.success) {
        toast.error(result.error || "Failed to save capture")
        return
      }

      toast.success("Captured!")
      
      // Pass created entry to onSuccess callback
      if (result.data) {
        onSuccess?.(result.data as JournalEntry)
      }
      onClose()
    } catch (error) {
      console.error("Failed to create journal entry:", error)
      toast.error("Failed to save capture")
    } finally {
      setSubmitting(false)
    }
  }

  // ==========================================================================
  // Textarea Auto-resize
  // ==========================================================================

  const handleTextareaInput = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 120), 300)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [])

  useEffect(() => {
    handleTextareaInput()
  }, [content, handleTextareaInput])

  // ==========================================================================
  // Entity Type Helpers
  // ==========================================================================

  const getEntityIcon = (type: LinkedEntity["type"]) => {
    switch (type) {
      case "client":
        return <Users className="w-3 h-3" />
      case "project":
        return <FolderKanban className="w-3 h-3" />
      case "content":
        return <FileText className="w-3 h-3" />
      case "page":
        return <BookOpen className="w-3 h-3" />
    }
  }

  const getEntityColor = (type: LinkedEntity["type"]) => {
    switch (type) {
      case "client":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      case "project":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "content":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "page":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    }
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-1/3 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-capture-title"
          >
            <div className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h2 id="quick-capture-title" className="text-sm font-medium">
                    Quick Capture
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Textarea with Mention Popover */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => {
                      mentionHandleChange(e)
                      handleTextareaInput()
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="What's on your mind?"
                    className={cn(
                      "w-full px-3 py-3 text-sm",
                      "bg-muted/30 border border-border rounded-lg",
                      "placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                      "resize-none",
                      "min-h-[120px] max-h-[300px]"
                    )}
                    aria-label="Capture your thought"
                  />

                  {/* Hint text */}
                  {!content && (
                    <div className="absolute bottom-3 left-3 text-xs text-muted-foreground pointer-events-none">
                      Type @ for mentions, # for tags
                    </div>
                  )}

                  {/* Mention Popover */}
                  <MentionPopover
                    isOpen={showMentionPopover}
                    onClose={() => setShowMentionPopover(false)}
                    searchQuery={mentionSearch}
                    onSearchChange={setMentionSearch}
                    onSelectClient={handleSelectClient}
                    onSelectProject={handleSelectProject}
                    onSelectContent={handleSelectContent}
                    onSelectJournalPage={handleSelectPage}
                    position={cursorPosition}
                    clients={clients}
                    projects={projects}
                    contentItems={contentItems}
                    journalPages={journalPages}
                    showSearchInput={false}
                    className="fixed"
                  />
                </div>

                {/* Linked Entities Chips */}
                {linkedEntities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center">Linked:</span>
                    {linkedEntities.map((entity) => (
                      <Badge
                        key={`${entity.type}-${entity.id}`}
                        variant="outline"
                        className={cn(
                          "gap-1.5 pr-1 text-xs",
                          getEntityColor(entity.type)
                        )}
                      >
                        {getEntityIcon(entity.type)}
                        <span className="max-w-[150px] truncate">{entity.name}</span>
                        <button
                          onClick={() => removeLinkedEntity(entity.id)}
                          className="ml-1 p-0.5 rounded hover:bg-foreground/10 transition-colors"
                          aria-label={`Remove ${entity.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">
                    Enter
                  </kbd>
                  {" "}to save
                  <span className="mx-2">·</span>
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">
                    Shift+Enter
                  </kbd>
                  {" "}for newline
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim() || submitting || !inboxId}
                    className="min-w-[80px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default QuickCaptureModal
