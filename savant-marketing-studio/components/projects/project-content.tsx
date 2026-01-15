'use client'

import Link from 'next/link'
import { FileText, Plus, Mail, Megaphone, Globe, Share2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ContentItem {
  id: string
  title: string
  asset_type: string | null
  updated_at: string
}

interface ProjectContentProps {
  projectId: string
  content: ContentItem[]
}

const ASSET_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  email: { label: 'Email', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Mail },
  ad: { label: 'Ad', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Megaphone },
  landing_page: { label: 'Landing', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: Globe },
  social_post: { label: 'Social', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400', icon: Share2 },
  blog_post: { label: 'Blog', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: BookOpen },
  note: { label: 'Note', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: FileText },
}

function getAssetTypeConfig(type: string | null) {
  if (!type) return { label: 'Content', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: FileText }
  return ASSET_TYPE_CONFIG[type] || { label: type, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: FileText }
}

export function ProjectContent({ projectId, content }: ProjectContentProps) {
  const isEmpty = content.length === 0
  
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
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/content/new?project_id=${projectId}`}>
            <Plus className="h-4 w-4 mr-1" />
            Add Content
          </Link>
        </Button>
      </div>
      
      {/* Content list or empty state */}
      {isEmpty ? (
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">No content linked to this project</p>
          <Button asChild variant="default" size="sm">
            <Link href={`/dashboard/content/new?project_id=${projectId}`}>
              <Plus className="h-4 w-4 mr-1" />
              Create Content
            </Link>
          </Button>
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
