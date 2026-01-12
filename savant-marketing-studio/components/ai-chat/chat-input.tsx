"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowUp, X, Brain } from "lucide-react"
import { MentionPopup } from "./mention-popup"

interface ChatInputProps {
  onSend: (content: string, mentions: { type: "client" | "content-type" | "writing-framework"; name: string; id: string }[], useExtendedThinking: boolean) => void
  disabled?: boolean
  clients: Array<{ id: string; name: string }>
  contentTypes: Array<{ id: string; name: string; category: string }>
  writingFrameworks: Array<{ id: string; name: string; category: string }>
}

export function ChatInput({ onSend, disabled, clients, contentTypes, writingFrameworks }: ChatInputProps) {
  const [value, setValue] = useState("")
  const [mentions, setMentions] = useState<{ type: "client" | "content-type" | "writing-framework"; name: string; id: string }[]>([])
  const [showMentionPopup, setShowMentionPopup] = useState(false)
  const [useExtendedThinking, setUseExtendedThinking] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // Check for @ mentions
    const lastAtIndex = newValue.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const textAfterAt = newValue.slice(lastAtIndex + 1)
      const hasSpaceAfter = textAfterAt.includes(" ")

      if (!hasSpaceAfter && textAfterAt.length <= 20) {
        setMentionQuery(textAfterAt)
        setShowMentionPopup(true)

        // Calculate popup position
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect()
          setMentionPosition({
            top: rect.top - 8,
            left: rect.left + 16,
          })
        }
      } else {
        setShowMentionPopup(false)
      }
    } else {
      setShowMentionPopup(false)
    }
  }

  const handleMentionSelect = (mention: {
    type: "client" | "content-type" | "writing-framework"
    name: string
    id: string
  }) => {
    // Remove the @query from the value
    const lastAtIndex = value.lastIndexOf("@")
    const newValue = value.slice(0, lastAtIndex)
    setValue(newValue)

    // Add the mention
    setMentions((prev) => [...prev, mention])
    setShowMentionPopup(false)
    textareaRef.current?.focus()
  }

  const removeMention = (id: string) => {
    setMentions((prev) => prev.filter((m) => m.id !== id))
  }

  const handleSubmit = () => {
    if (!value.trim() && mentions.length === 0) return
    onSend(value.trim(), mentions, useExtendedThinking)
    setValue("")
    setMentions([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
    // Keep the thinking toggle state for convenience
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") {
      setShowMentionPopup(false)
    }
  }

  const getMentionColor = (type: "client" | "content-type" | "writing-framework") => {
    switch (type) {
      case "client":
        return "bg-primary/10 text-primary"
      case "content-type":
        return "bg-info/10 text-info"
      case "writing-framework":
        return "bg-warning/10 text-warning"
    }
  }

  return (
    <div className="relative">
      {/* Mention Pills */}
      {mentions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {mentions.map((mention) => (
            <span
              key={mention.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                getMentionColor(mention.type),
              )}
            >
              @{mention.name}
              <button onClick={() => removeMention(mention.id)} className="ml-0.5 rounded-full p-0.5 hover:bg-black/10">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message DRSS AI... (@ to mention)"
          disabled={disabled}
          rows={1}
          className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setUseExtendedThinking(!useExtendedThinking)}
          title={useExtendedThinking ? 'Extended thinking enabled' : 'Enable extended thinking'}
          className={cn(
            "h-9 w-9 shrink-0 rounded-lg transition-colors",
            useExtendedThinking 
              ? "bg-primary/10 text-primary hover:bg-primary/20" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Brain className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={disabled || (!value.trim() && mentions.length === 0)}
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>

      {/* Mention Popup */}
      {showMentionPopup && (
        <MentionPopup
          query={mentionQuery}
          position={mentionPosition}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentionPopup(false)}
          clients={clients}
          contentTypes={contentTypes}
          writingFrameworks={writingFrameworks}
        />
      )}
    </div>
  )
}
