'use client'

import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AIConversation {
  id: string
  title: string
  status: string
  created_at: string | null
  updated_at: string | null
  total_input_tokens: number | null
  total_output_tokens: number | null
  total_cost_usd: number | null
}

interface ClientAIChatsTabProps {
  conversations: AIConversation[]
  clientId: string
}

export function ClientAIChatsTab({ conversations, clientId }: ClientAIChatsTabProps) {
  // Suppress unused variable warning - clientId reserved for future use
  void clientId

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No AI chats yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start a conversation and @mention this client to link it here.
        </p>
        <Button asChild>
          <Link href="/dashboard/ai">
            Start AI Chat
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => {
        const totalTokens = (conv.total_input_tokens || 0) + (conv.total_output_tokens || 0)
        const cost = conv.total_cost_usd || 0
        const updatedAt = conv.updated_at ? new Date(conv.updated_at) : new Date()
        
        return (
          <Card key={conv.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <h4 className="font-medium text-foreground truncate">
                      {conv.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(updatedAt, { addSuffix: true })}
                    </span>
                    <span>•</span>
                    <span>{totalTokens.toLocaleString()} tokens</span>
                    {cost > 0 && (
                      <>
                        <span>•</span>
                        <span>${cost.toFixed(4)}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/ai/chat?conversation=${conv.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
