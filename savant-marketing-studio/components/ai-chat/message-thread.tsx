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
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
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

        {/* Actions for AI messages */}
        {!isUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered || isLast ? 1 : 0 }}
            className="mt-3 flex items-center gap-1 border-t border-border pt-2"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-3 w-3" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-3 w-3" />
                  Save
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate(message.id)}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
