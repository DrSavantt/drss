"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Copy, Bookmark, RefreshCw, Check, Loader2 } from "lucide-react"
import type { Message } from "./chat-interface"
import ReactMarkdown from "react-markdown"

interface MessageThreadProps {
  messages: Message[]
  isGenerating: boolean
  onCopy: (content: string) => void
  onSave: (message: Message) => void
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
          isGenerating={isGenerating && index === messages.length - 1 && message.role === "assistant"}
          onCopy={onCopy}
          onSave={onSave}
          onRegenerate={onRegenerate}
        />
      ))}

      {isGenerating && messages[messages.length - 1]?.role === "user" && (
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
  message: Message
  isLast: boolean
  isGenerating: boolean
  onCopy: (content: string) => void
  onSave: (message: Message) => void
  onRegenerate: (messageId: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleCopy = () => {
    onCopy(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === "user"

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
        {/* Mention Pills */}
        {message.mentions && message.mentions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {message.mentions.map((mention) => (
              <span
                key={mention.id}
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  mention.type === "client" ? "bg-primary/10 text-primary" : "bg-info/10 text-info",
                )}
              >
                @{mention.name}
              </span>
            ))}
          </div>
        )}

        {/* Message Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

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
              onClick={() => onSave(message)}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Bookmark className="h-3 w-3" />
              Save
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
