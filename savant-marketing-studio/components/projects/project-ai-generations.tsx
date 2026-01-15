'use client'

import Link from 'next/link'
import { Bot, Sparkles, Search, FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface AIGeneration {
  id: string
  generation_type: string | null
  model_used: string | null
  tokens_used: number | null
  created_at: string
}

interface ProjectAIGenerationsProps {
  projectId: string
  aiGenerations: AIGeneration[]
}

// Format model names to be human-readable
function formatModelName(model: string | null): string {
  if (!model) return 'Unknown'
  
  const modelLower = model.toLowerCase()
  
  if (modelLower.includes('sonnet')) return 'Sonnet 3.5'
  if (modelLower.includes('opus')) return 'Opus'
  if (modelLower.includes('haiku')) return 'Haiku'
  if (modelLower.includes('gpt-4')) return 'GPT-4'
  if (modelLower.includes('gpt-3')) return 'GPT-3.5'
  
  // Truncate if too long
  if (model.length > 15) return model.slice(0, 12) + '...'
  return model
}

// Format generation type to be human-readable
function formatGenerationType(type: string | null): string {
  if (!type) return 'Generation'
  
  const typeMap: Record<string, string> = {
    content_generation: 'Content Generation',
    research: 'Research',
    deep_research: 'Deep Research',
    analysis: 'Analysis',
    summary: 'Summary',
    chat: 'Chat',
  }
  
  if (typeMap[type]) return typeMap[type]
  
  // Convert snake_case to Title Case
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Get icon and color for generation type
const GENERATION_TYPE_CONFIG: Record<string, { icon: typeof Bot; color: string }> = {
  content_generation: { 
    icon: FileText, 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  research: { 
    icon: Search, 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
  },
  deep_research: { 
    icon: Search, 
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' 
  },
  analysis: { 
    icon: Zap, 
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
  },
  chat: { 
    icon: Sparkles, 
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' 
  },
}

function getGenerationTypeConfig(type: string | null) {
  if (!type) return { 
    icon: Bot, 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' 
  }
  return GENERATION_TYPE_CONFIG[type] || { 
    icon: Bot, 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' 
  }
}

// Format token count with thousands separator
function formatTokens(tokens: number | null): string {
  if (tokens === null || tokens === undefined) return '—'
  return tokens.toLocaleString()
}

export function ProjectAIGenerations({ projectId, aiGenerations }: ProjectAIGenerationsProps) {
  const isEmpty = aiGenerations.length === 0
  
  return (
    <section id="ai-section" className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">AI Generations</h2>
          <Badge variant="secondary" className="rounded-full">
            {aiGenerations.length}
          </Badge>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/ai-studio?project_id=${projectId}`}>
            <Sparkles className="h-4 w-4 mr-1" />
            AI Studio
          </Link>
        </Button>
      </div>
      
      {/* Content list or empty state */}
      {isEmpty ? (
        <div className="p-8 text-center">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">No AI generations for this project</p>
          <Button asChild variant="default" size="sm">
            <Link href={`/dashboard/ai-studio?project_id=${projectId}`}>
              <Sparkles className="h-4 w-4 mr-1" />
              Go to AI Studio
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y">
          {aiGenerations.map((item) => {
            const typeConfig = getGenerationTypeConfig(item.generation_type)
            const Icon = typeConfig.icon
            
            return (
              <li key={item.id}>
                <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs font-medium shrink-0", typeConfig.color)}
                    >
                      {formatGenerationType(item.generation_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 text-sm">
                    <span className="text-muted-foreground font-medium">
                      {formatModelName(item.model_used)}
                    </span>
                    
                    <span className="text-muted-foreground tabular-nums">
                      {formatTokens(item.tokens_used)} tokens
                    </span>
                    
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: false })}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
