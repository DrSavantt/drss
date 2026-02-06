'use client'

import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { getContentTypeConfig } from '@/lib/content-types'

interface ContentItem {
  id: string
  title: string
  asset_type: string | null
  updated_at: string
}

interface ProjectContentProps {
  projectId: string
  clientId: string | null
  content: ContentItem[]
}

function getAssetTypeConfig(type: string | null) {
  const fallback = { 
    label: 'Content', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', 
    icon: FileText 
  };
  
  if (!type) return fallback;
  
  const config = getContentTypeConfig(type);
  
  // Map central config text colors to badge background colors for this component
  const badgeColorMap: Record<string, string> = {
    'text-blue-500': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'text-red-500': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'text-cyan-500': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    'text-purple-500': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'text-green-500': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'text-orange-500': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'text-pink-500': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  };
  
  return {
    label: config.label,
    color: badgeColorMap[config.color] || fallback.color,
    icon: config.icon,
  };
}

export function ProjectContent({ projectId, clientId, content }: ProjectContentProps) {
  const isEmpty = content.length === 0
  
  // Build content creation link - requires clientId
  const contentNewLink = clientId 
    ? `/dashboard/clients/${clientId}/content/new?project_id=${projectId}`
    : null
  
  return (
    <section id="content-section" className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Content</h2>
          <Badge variant="secondary" className="rounded-full">
            {content.length}
          </Badge>
        </div>
        {contentNewLink ? (
          <Button asChild size="sm" variant="outline">
            <Link href={contentNewLink}>
              <Plus className="h-4 w-4 mr-1" />
              Add Content
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled title="Assign a client to add content">
            <Plus className="h-4 w-4 mr-1" />
            Add Content
          </Button>
        )}
      </div>
      
      {/* Content list or empty state */}
      {isEmpty ? (
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">No content linked to this project</p>
          {contentNewLink ? (
            <Button asChild variant="default" size="sm">
              <Link href={contentNewLink}>
                <Plus className="h-4 w-4 mr-1" />
                Create Content
              </Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Assign a client to this project to create content</p>
          )}
        </div>
      ) : (
        <ul className="divide-y">
          {content.map((item) => {
            const typeConfig = getAssetTypeConfig(item.asset_type)
            const Icon = typeConfig.icon
            
            return (
              <li key={item.id}>
                <Link 
                  href={`/dashboard/content/${item.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  
                  <span className="font-medium truncate flex-1 min-w-0">
                    {item.title || 'Untitled'}
                  </span>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs font-medium", typeConfig.color)}
                    >
                      {typeConfig.label}
                    </Badge>
                    
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {formatDistanceToNow(new Date(item.updated_at), { addSuffix: false })}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
