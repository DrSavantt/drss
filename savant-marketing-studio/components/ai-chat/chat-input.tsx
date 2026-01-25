"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowUp, X, Brain, Plus, AlertTriangle } from "lucide-react"
import { ContextPickerModal, type ContextItem } from "./context-picker-modal"
import { InlineMentionPopup, type InlineMentionPopupRef } from "./inline-mention-popup"
import { FrameworkSuggestions } from "./framework-suggestions"

interface ChatInputProps {
  onSend: (content: string, context: ContextItem[], useExtendedThinking: boolean) => void
  disabled?: boolean
  clients: Array<{ id: string; name: string }>
  projects: Array<{ id: string; name: string; clientName?: string | null }>
  contentAssets: Array<{ id: string; title: string; contentType?: string | null; clientName?: string | null }>
  journalEntries: Array<{
    id: string
    title: string | null
    content: string
    tags?: string[] | null
    mentionedClients?: Array<{ id: string; name: string }>
    mentionedProjects?: Array<{ id: string; name: string }>
    mentionedContent?: Array<{ id: string; name: string }>
  }>
  writingFrameworks: Array<{ id: string; name: string; category?: string }>
  // Token overflow warning props
  currentTokens?: number
  maxTokens?: number
}

// Rough token estimation: ~4 characters = 1 token
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function ChatInput({
  onSend,
  disabled,
  clients,
  projects,
  contentAssets,
  journalEntries,
  writingFrameworks,
  currentTokens = 0,
  maxTokens = 200000,
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([])
  const [useExtendedThinking, setUseExtendedThinking] = useState(false)
  const [showContextModal, setShowContextModal] = useState(false)
  const [initialSearch, setInitialSearch] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Inline @ mention popup state
  const [showInlinePopup, setShowInlinePopup] = useState(false)
  const [inlineQuery, setInlineQuery] = useState("")
  const [inlinePosition, setInlinePosition] = useState({ top: 0, left: 0 })
  const [inlineSelectedIndex, setInlineSelectedIndex] = useState(0)
  const inlinePopupRef = useRef<InlineMentionPopupRef>(null)
  
  // Token overflow warning state
  const [showOverflowWarning, setShowOverflowWarning] = useState(false)
  const [projectedTokens, setProjectedTokens] = useState(0)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  // Calculate token overflow warning
  useEffect(() => {
    const messageTokens = estimateTokens(value)
    // Estimate context tokens from selected items (rough estimate of serialized content)
    const contextTokens = selectedContext.reduce((total, item) => {
      // Estimate ~50 tokens per context item (name, metadata, etc.)
      return total + 50
    }, 0)
    const projected = currentTokens + messageTokens + contextTokens
    setProjectedTokens(projected)
    setShowOverflowWarning(projected > maxTokens * 0.9)
  }, [value, selectedContext, currentTokens, maxTokens])

  // Handle @ key to show inline popup
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // Check for @ trigger for inline popup
    const lastAtIndex = newValue.lastIndexOf("@")
    
    if (lastAtIndex !== -1) {
      const textAfterAt = newValue.slice(lastAtIndex + 1)
      const hasSpaceAfter = textAfterAt.includes(" ")
      const hasNewlineAfter = textAfterAt.includes("\n")
      
      // Show inline popup if @ exists and no space/newline after it yet
      // Also limit query length to prevent showing for unrelated @ in middle of text
      if (!hasSpaceAfter && !hasNewlineAfter && textAfterAt.length <= 30) {
        setInlineQuery(textAfterAt)
        setInlineSelectedIndex(0) // Reset selection when query changes
        setShowInlinePopup(true)
        
        // Calculate position near textarea
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect()
          setInlinePosition({
            top: rect.top - 8,
            left: rect.left + 16,
          })
        }
      } else {
        setShowInlinePopup(false)
      }
    } else {
      setShowInlinePopup(false)
    }
  }

  // Handle context selection from modal
  const handleContextSelect = (items: ContextItem[]) => {
    setSelectedContext(prev => {
      // Merge with existing, avoiding duplicates
      const newItems = items.filter(item => 
        !prev.some(p => p.id === item.id && p.type === item.type)
      )
      return [...prev, ...newItems]
    })
  }

  // Remove context item
  const removeContext = (id: string, type: string) => {
    setSelectedContext(prev => prev.filter(c => !(c.id === id && c.type === type)))
  }

  // Handle inline @ mention selection
  const handleInlineSelect = (item: ContextItem) => {
    // Remove @query from the input value
    const lastAtIndex = value.lastIndexOf("@")
    const newValue = lastAtIndex >= 0 ? value.slice(0, lastAtIndex) : value
    setValue(newValue)
    
    // Add the selected item
    setSelectedContext(prev => {
      if (prev.some(p => p.id === item.id && p.type === item.type)) {
        return prev // Already exists
      }
      return [...prev, item]
    })
    
    setShowInlinePopup(false)
    textareaRef.current?.focus()
  }

  // Submit message
  const handleSubmit = () => {
    if (!value.trim() && selectedContext.length === 0) return
    onSend(value.trim(), selectedContext, useExtendedThinking)
    setValue("")
    setSelectedContext([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // When inline popup is open, intercept navigation keys
    if (showInlinePopup) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setInlineSelectedIndex(prev => prev + 1)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setInlineSelectedIndex(prev => Math.max(0, prev - 1))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        // Signal popup to select current item
        inlinePopupRef.current?.selectCurrent()
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setShowInlinePopup(false)
        return
      }
      if (e.key === "Tab") {
        e.preventDefault()
        inlinePopupRef.current?.selectCurrent()
        return
      }
    }
    
    // Normal submit behavior
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Get pill color
  const getPillColor = (type: string) => {
    switch (type) {
      case "client": return "bg-primary/10 text-primary"
      case "project": return "bg-secondary/20 text-secondary-foreground"
      case "content": return "bg-amber-500/10 text-amber-700"
      case "capture": return "bg-emerald-500/10 text-emerald-600"
      case "framework": return "bg-orange-500/10 text-orange-600"
      default: return "bg-muted text-muted-foreground"
    }
  }

  // Handle framework suggestion selection
  const handleFrameworkSelect = (item: ContextItem) => {
    setSelectedContext(prev => {
      if (prev.some(p => p.id === item.id && p.type === item.type)) {
        return prev // Already exists
      }
      return [...prev, item]
    })
  }

  return (
    <>
      <div className="relative">
        {/* Framework Suggestions - RAG-powered semantic search */}
        <FrameworkSuggestions
          userMessage={value}
          onSelectFramework={handleFrameworkSelect}
          disabled={disabled}
        />

        {/* Context Pills - horizontal scroll on mobile, wrap on desktop */}
        {selectedContext.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto scrollbar-hide max-w-full pb-1 md:flex-wrap md:overflow-visible">
            {selectedContext.map((item) => (
              <span
                key={`${item.type}-${item.id}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium shrink-0",
                  "min-h-[32px]", // Better touch target
                  getPillColor(item.type)
                )}
              >
                @{item.name}
                <button 
                  onClick={() => removeContext(item.id, item.type)} 
                  className="ml-0.5 rounded-full p-1 hover:bg-black/10 min-w-[24px] min-h-[24px] flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Token Overflow Warning */}
        {showOverflowWarning && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              This message may exceed the context limit ({Math.round((projectedTokens / maxTokens) * 100)}% of {maxTokens.toLocaleString()} tokens). Consider summarizing first.
            </span>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2">
          {/* Add Context Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setInitialSearch("")
              setShowContextModal(true)
            }}
            title="Add context"
          >
            <Plus className="h-5 w-5" />
          </Button>

          {/* Text Input - text-base (16px) prevents iOS zoom on focus */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message DRSS AI... (@ to add context)"
            disabled={disabled}
            rows={1}
            className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />

          {/* Extended Thinking Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setUseExtendedThinking(!useExtendedThinking)}
            title={useExtendedThinking ? 'Extended thinking enabled' : 'Enable extended thinking'}
            className={cn(
              "h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-lg transition-colors",
              useExtendedThinking 
                ? "bg-primary/10 text-primary hover:bg-primary/20" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Brain className="h-5 w-5" />
          </Button>

          {/* Send Button */}
          <Button
            onClick={handleSubmit}
            disabled={disabled || (!value.trim() && selectedContext.length === 0)}
            size="icon"
            className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Inline @ Mention Popup */}
      {showInlinePopup && (
        <InlineMentionPopup
          ref={inlinePopupRef}
          query={inlineQuery}
          position={inlinePosition}
          selectedIndex={inlineSelectedIndex}
          onSelectedIndexChange={setInlineSelectedIndex}
          onSelect={handleInlineSelect}
          onClose={() => setShowInlinePopup(false)}
          clients={clients}
          projects={projects}
          contentAssets={contentAssets}
          journalEntries={journalEntries}
          writingFrameworks={writingFrameworks}
        />
      )}

      {/* Context Picker Modal */}
      <ContextPickerModal
        open={showContextModal}
        onOpenChange={setShowContextModal}
        onSelect={handleContextSelect}
        initialSearch={initialSearch}
        clients={clients}
        projects={projects}
        contentAssets={contentAssets}
        journalEntries={journalEntries}
        writingFrameworks={writingFrameworks}
      />
    </>
  )
}
