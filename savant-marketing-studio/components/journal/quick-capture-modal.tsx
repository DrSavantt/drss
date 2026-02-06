"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { X, Zap, Loader2, Users, FolderKanban, FileText, BookOpen, GripHorizontal } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InlineMentionPopup, type InlineMentionPopupRef } from "@/components/ai-chat/inline-mention-popup"
import { type ContextItem } from "@/components/ai-chat/context-picker-modal"
import { useMentionDetection, type CursorPosition } from "@/components/journal/use-mention-detection"
import { getClients } from "@/app/actions/clients"
import { getProjects } from "@/app/actions/projects"
import { getAllContentAssets } from "@/app/actions/content"
import { getPageTree, createQuickCapture } from "@/app/actions/journal-pages"

// =============================================================================
// Constants
// =============================================================================

const MODAL_WIDTH = 420
const MODAL_MIN_HEIGHT = 200
const MODAL_EDGE_PADDING = 24

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
  onSuccess?: (entry: { id: string; title: string }) => void
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
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 })
  const dragControls = useDragControls()
  
  // Mention popover state
  const [showMentionPopover, setShowMentionPopover] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ top: 0, left: 0 })
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)
  
  // Data state
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string; client_id?: string; clientName?: string }>>([])
  const [contentItems, setContentItems] = useState<Array<{ id: string; title: string; clientName?: string }>>([])
  const [journalPages, setJournalPages] = useState<Array<{ id: string; title: string; icon?: string }>>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const mentionPopupRef = useRef<InlineMentionPopupRef>(null)
  
  // Ref for the textarea container (for relative positioning)
  const textareaContainerRef = useRef<HTMLDivElement>(null)

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
    // NO-OP callbacks - we manage popup state ourselves now with inline detection
    onMentionTrigger: () => {},
    onMentionClose: () => {},
  })

  // ==========================================================================
  // Calculate drag constraints based on window size
  // ==========================================================================

  useEffect(() => {
    const updateConstraints = () => {
      const modalHeight = modalRef.current?.offsetHeight || MODAL_MIN_HEIGHT
      setDragConstraints({
        left: -window.innerWidth + MODAL_WIDTH + MODAL_EDGE_PADDING * 2,
        right: 0,
        top: -window.innerHeight + modalHeight + MODAL_EDGE_PADDING * 2,
        bottom: 0,
      })
    }

    updateConstraints()
    window.addEventListener("resize", updateConstraints)
    return () => window.removeEventListener("resize", updateConstraints)
  }, [isOpen])

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
      ] = await Promise.all([
        getClients(),
        getProjects(),
        getAllContentAssets(),
        getPageTree(),
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
      const flattenPages = (nodes: any[]): Array<{ id: string; title: string; icon?: string }> => {
        const result: Array<{ id: string; title: string; icon?: string }> = []
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

  // Unified mention selection handler for InlineMentionPopup
  const handleMentionSelect = useCallback((item: ContextItem) => {
    // Map ContextItem type to mention type (page is same, but capture isn't used in Quick Capture)
    const mentionType = item.type === "page" ? "page" : item.type as "client" | "project" | "content"
    
    insertMention(mentionType, { id: item.id, name: item.name })
    
    setLinkedEntities(prev => {
      if (prev.some(e => e.id === item.id && e.type === item.type)) return prev
      return [...prev, { id: item.id, name: item.name, type: item.type as LinkedEntity["type"] }]
    })
    
    setShowMentionPopover(false)
    setMentionSelectedIndex(0)
  }, [insertMention])

  const removeLinkedEntity = useCallback((id: string) => {
    setLinkedEntities(prev => prev.filter(e => e.id !== id))
  }, [])

  // ==========================================================================
  // Keyboard Handling
  // ==========================================================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // When mention popup is open, intercept navigation keys
    if (showMentionPopover) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionSelectedIndex(prev => prev + 1)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionSelectedIndex(prev => Math.max(0, prev - 1))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        mentionPopupRef.current?.selectCurrent()
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setShowMentionPopover(false)
        setMentionSelectedIndex(0)
        return
      }
      if (e.key === "Tab") {
        e.preventDefault()
        mentionPopupRef.current?.selectCurrent()
        return
      }
    }
    
    // NOTE: mentionHandleKeyDown removed - we handle all keyboard events inline now

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
  }, [showMentionPopover, isMentionActive, onClose])

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
    if (!content.trim() || submitting) return

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

      // Create entry via server action - saves to root level (no inbox needed)
      const result = await createQuickCapture(content.trim(), {
        mentionedClients: clientIds,
        mentionedProjects: projectIds,
        mentionedContent: contentIds,
        mentionedPages: pageIds,
        tags,
      })

      if (!result.success) {
        toast.error(result.error || "Failed to save capture")
        return
      }

      toast.success("Captured!")
      
      // Pass created entry to onSuccess callback
      if (result.data) {
        onSuccess?.(result.data)
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
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 80), 200)
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
  // Drag Handlers
  // ==========================================================================

  const startDrag = (event: React.PointerEvent) => {
    dragControls.start(event)
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={dragConstraints}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          initial={{ 
            opacity: 0, 
            scale: 0.95,
            x: 0,
            y: 0,
          }}
          animate={{ 
            opacity: 1, 
            scale: 1,
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.95,
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            right: MODAL_EDGE_PADDING,
            bottom: MODAL_EDGE_PADDING,
            width: MODAL_WIDTH,
          }}
          className="z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-capture-title"
        >
          <div className={cn(
            "bg-background/95 backdrop-blur-md",
            "border border-border rounded-xl",
            "shadow-2xl",
            "overflow-hidden"
          )}>
            {/* Draggable Header */}
            <div 
              onPointerDown={startDrag}
              className={cn(
                "flex items-center justify-between px-3 py-2.5",
                "border-b border-border bg-muted/40",
                "select-none",
                isDragging ? "cursor-grabbing" : "cursor-grab"
              )}
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-muted-foreground/50" />
                <Zap className="w-4 h-4 text-primary" />
                <h2 id="quick-capture-title" className="text-sm font-medium">
                  Quick Capture
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              {/* Textarea with Mention Popover - container is relative for absolute popover positioning */}
              <div ref={textareaContainerRef} className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setContent(newValue)
                    handleTextareaInput()
                    
                    // Simple @ detection (same as AI Chat - no strict "char before @" check)
                    const lastAtIndex = newValue.lastIndexOf("@")
                    
                    if (lastAtIndex !== -1) {
                      const textAfterAt = newValue.slice(lastAtIndex + 1)
                      const hasSpaceAfter = textAfterAt.includes(" ")
                      const hasNewlineAfter = textAfterAt.includes("\n")
                      
                      // Show popup if @ exists and no space/newline after it yet
                      if (!hasSpaceAfter && !hasNewlineAfter && textAfterAt.length <= 30) {
                        setMentionSearch(textAfterAt)
                        setShowMentionPopover(true)
                        setMentionSelectedIndex(0)
                        
                        // Calculate position from textarea
                        if (textareaRef.current) {
                          const rect = textareaRef.current.getBoundingClientRect()
                          setCursorPosition({
                            top: rect.top - 8,
                            left: rect.left + 16,
                          })
                        }
                      } else {
                        setShowMentionPopover(false)
                      }
                    } else {
                      setShowMentionPopover(false)
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="What's on your mind? Type @ for mentions, # for tags..."
                  className={cn(
                    "w-full px-3 py-2.5 text-sm",
                    "bg-muted/30 border border-border rounded-lg",
                    "placeholder:text-muted-foreground/70",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                    "resize-none",
                    "min-h-[80px] max-h-[200px]"
                  )}
                  aria-label="Capture your thought"
                />

                {/* Unified Mention Popup - rendered via portal to escape modal overflow */}
                {showMentionPopover && typeof document !== 'undefined' && createPortal(
                  <InlineMentionPopup
                    ref={mentionPopupRef}
                    query={mentionSearch}
                    position={cursorPosition}
                    selectedIndex={mentionSelectedIndex}
                    onSelectedIndexChange={setMentionSelectedIndex}
                    onSelect={handleMentionSelect}
                    onClose={() => {
                      setShowMentionPopover(false)
                      setMentionSelectedIndex(0)
                    }}
                    clients={clients}
                    projects={projects.map(p => ({ id: p.id, name: p.name, clientName: p.clientName }))}
                    contentAssets={contentItems.map(c => ({ id: c.id, title: c.title, clientName: c.clientName }))}
                    journalEntries={[]} // Quick Capture doesn't need to link to other captures
                    writingFrameworks={[]} // Quick Capture doesn't need frameworks
                    journalPages={journalPages}
                  />,
                  document.body
                )}
              </div>

              {/* Linked Entities Chips */}
              {linkedEntities.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground self-center mr-1">Linked:</span>
                  {linkedEntities.map((entity) => (
                    <Badge
                      key={`${entity.type}-${entity.id}`}
                      variant="outline"
                      className={cn(
                        "gap-1 pr-0.5 text-xs h-6",
                        getEntityColor(entity.type)
                      )}
                    >
                      {getEntityIcon(entity.type)}
                      <span className="max-w-[120px] truncate">{entity.name}</span>
                      <button
                        onClick={() => removeLinkedEntity(entity.id)}
                        className="ml-0.5 p-0.5 rounded hover:bg-foreground/10 transition-colors"
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
            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px]">
                  ↵
                </kbd>
                <span>save</span>
                <span className="mx-1 text-muted-foreground/50">·</span>
                <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px]">
                  esc
                </kbd>
                <span>close</span>
              </div>

              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="h-7 px-3 text-xs"
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default QuickCaptureModal
