"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Copy, Bookmark, RefreshCw, Check, Loader2 } from "lucide-react"
import type { ConversationMessage } from "@/app/actions/chat"

interface MessageThreadProps {
  messages: ConversationMessage[]
  isGenerating: boolean
  onCopy: (content: string) => void
  onSave: (message: ConversationMessage) => Promise<boolean>
  onRegenerate: (messageId: string) => void
}

export function MessageThread({ messages, isGenerating, onCopy, onSave, onRegenerate }: MessageThreadProps) {
  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
          isGenerating={isGenerating && index === messages.length - 1 && message.messageRole === "assistant"}
          onCopy={onCopy}
          onSave={onSave}
          onRegenerate={onRegenerate}
        />
      ))}

      {isGenerating && messages[messages.length - 1]?.messageRole === "user" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function MessageBubble({
  message,
  isLast,
  isGenerating,
  onCopy,
  onSave,
  onRegenerate,
}: {
  message: ConversationMessage
  isLast: boolean
  isGenerating: boolean
  onCopy: (content: string) => void
  onSave: (message: ConversationMessage) => Promise<boolean>
  onRegenerate: (messageId: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Extract content based on message role
  const content = message.content

  const handleCopy = () => {
    onCopy(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    const success = await onSave(message)
    setSaving(false)
    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const isUser = message.messageRole === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex group", isUser ? "justify-end" : "justify-start")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "relative max-w-[85%] rounded-2xl px-4 py-3",
          isUser ? "bg-muted text-foreground" : "bg-card text-foreground",
        )}
      >
        {/* Message Content */}
        <div className="whitespace-pre-wrap break-words text-sm">{content}</div>

        {/* Actions for AI messages - always visible on mobile, hover on desktop */}
        {!isUser && (
          <div
            className={cn(
              "mt-3 flex items-center gap-1 border-t border-border pt-2 transition-opacity duration-200",
              // Mobile: always visible
              "opacity-100",
              // Desktop: show on hover or if last message, otherwise hidden
              "md:opacity-0 md:group-hover:opacity-100",
              // Also show on desktop if it's the last message or hovered
              (hovered || isLast) && "md:opacity-100"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-9 min-h-[44px] gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-9 min-h-[44px] gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline">Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate(message.id)}
              className="h-9 min-h-[44px] gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
