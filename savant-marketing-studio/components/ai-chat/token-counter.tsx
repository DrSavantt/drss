'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface TokenCounterProps {
  inputTokens: number
  outputTokens: number
  maxTokens?: number // Default 200,000 for Claude
}

export function TokenCounter({ 
  inputTokens, 
  outputTokens, 
  maxTokens = 200000 
}: TokenCounterProps) {
  const totalTokens = inputTokens + outputTokens
  const percentage = Math.min((totalTokens / maxTokens) * 100, 100)
  
  // Color thresholds: green (<50%), yellow (50-80%), red (>80%)
  const getColorClasses = () => {
    if (percentage >= 80) return {
      text: 'text-destructive',
      indicator: 'bg-destructive'
    }
    if (percentage >= 50) return {
      text: 'text-yellow-600 dark:text-yellow-500',
      indicator: 'bg-yellow-500'
    }
    return {
      text: 'text-green-600 dark:text-green-500',
      indicator: 'bg-green-500'
    }
  }
  
  const colors = getColorClasses()
  
  // Format number with commas
  const formatNumber = (num: number) => num.toLocaleString()
  
  return (
    <div className="flex items-center gap-2" aria-label={`Token usage: ${totalTokens} of ${maxTokens} tokens`}>
      <div className="flex flex-col items-end gap-0.5">
        <span className={cn("text-xs font-medium tabular-nums", colors.text)}>
          {formatNumber(totalTokens)} / {formatNumber(maxTokens)}
        </span>
        <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300 ease-out", colors.indicator)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {percentage >= 80 && (
        <AlertTriangle className={cn("h-4 w-4 flex-shrink-0", colors.text)} />
      )}
    </div>
  )
}
