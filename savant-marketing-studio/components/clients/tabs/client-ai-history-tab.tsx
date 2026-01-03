'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Clock, DollarSign, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { formatCost, getModelLabel } from '@/lib/ai/pricing'

// ============================================================================
// CLIENT AI HISTORY TAB
// All data pre-fetched server-side. NO loading spinner on tab switch!
// ============================================================================

interface AIExecution {
  id: string
  task_type: string
  complexity: string
  model_id: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  duration_ms: number
  created_at: string
  input_data?: {
    messages?: Array<{ role: string; content: string }>
  }
  output_data?: {
    content?: string
  }
}

interface ClientAIHistoryTabProps {
  clientId: string
  executions: AIExecution[]
}

export function ClientAIHistoryTab({ clientId, executions }: ClientAIHistoryTabProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Calculate totals from pre-fetched data
  const totalSpend = executions.reduce((sum, e) => sum + (e.cost_usd || 0), 0)
  const totalTokens = executions.reduce((sum, e) => sum + (e.input_tokens || 0) + (e.output_tokens || 0), 0)
  const totalExecutions = executions.length

  const formatTaskType = (taskType: string) => {
    return taskType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getPromptPreview = (execution: AIExecution) => {
    const firstMessage = execution.input_data?.messages?.[0]
    if (!firstMessage) return 'No prompt available'
    
    const content = firstMessage.content
    return content.length > 100 ? content.substring(0, 100) + '...' : content
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No AI History</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This client hasn't used any AI features yet. AI generations will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-primary" />
              Total Generations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground mt-1">AI requests made</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Total Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalTokens.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tokens processed</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Total Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCost(totalSpend)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">AI costs incurred</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Generations List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>AI Generations</CardTitle>
          <CardDescription>
            Complete history of AI requests for this client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {executions.map((execution) => {
            const isExpanded = expandedIds.has(execution.id)
            const executionTotalTokens = (execution.input_tokens || 0) + (execution.output_tokens || 0)
            const modelLabel = getModelLabel(execution.model_id)

            return (
              <div
                key={execution.id}
                className="border border-border rounded-lg p-4 hover:border-border/80 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">
                        {formatTaskType(execution.task_type)}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {execution.complexity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {modelLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {executionTotalTokens.toLocaleString()} tokens
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCost(execution.cost_usd || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {execution.duration_ms}ms
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                    {formatDistanceToNow(new Date(execution.created_at), { addSuffix: true })}
                  </div>
                </div>

                {/* Prompt Preview */}
                <div className="mt-3 text-sm text-muted-foreground bg-muted/30 rounded p-3 border border-border/50">
                  <p className="text-xs font-medium mb-1">Prompt:</p>
                  <p className="text-foreground/80">
                    {isExpanded 
                      ? execution.input_data?.messages?.[0]?.content || 'No prompt available'
                      : getPromptPreview(execution)
                    }
                  </p>
                </div>

                {/* Expandable Output */}
                {isExpanded && (
                  <div className="mt-3 text-sm text-muted-foreground bg-muted/30 rounded p-3 border border-border/50">
                    <p className="text-xs font-medium mb-1">Generated Output:</p>
                    <p className="text-foreground/80 whitespace-pre-wrap">
                      {execution.output_data?.content || 'No output available'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(execution.id)}
                    className="h-7 text-xs"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Hide Output
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        View Output
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

