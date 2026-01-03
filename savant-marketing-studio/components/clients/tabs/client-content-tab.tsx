'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Calendar, Sparkles, Mail, Search, File } from 'lucide-react'

// ============================================================================
// CLIENT CONTENT TAB
// All data pre-fetched. No API calls on mount.
// ============================================================================

interface ContentItem {
  id: string
  title: string
  asset_type: string
  file_size?: number
  created_at: string
}

interface ClientContentTabProps {
  clientId: string
  clientName: string
  content: ContentItem[]
  onContentCreated: (item: ContentItem) => void
  onContentDeleted: (id: string) => void
  onNewContent: () => void
}

function getContentIcon(assetType: string) {
  switch (assetType) {
    case 'note':
      return <FileText className="h-4 w-4 text-blue-500" />
    case 'research_pdf':
      return <File className="h-4 w-4 text-red-500" />
    case 'research_report':
      return <Search className="h-4 w-4 text-primary" />
    case 'ad_copy':
      return <Sparkles className="h-4 w-4 text-purple-500" />
    case 'email':
      return <Mail className="h-4 w-4 text-green-500" />
    case 'blog_post':
      return <FileText className="h-4 w-4 text-orange-500" />
    default:
      return <File className="h-4 w-4 text-gray-500" />
  }
}

export function ClientContentTab({
  clientId,
  clientName,
  content,
  onContentCreated,
  onContentDeleted,
  onNewContent
}: ClientContentTabProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Library</CardTitle>
            <CardDescription>All content assets for {clientName}</CardDescription>
          </div>
          <Button size="sm" onClick={onNewContent}>
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {content.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-base font-medium mb-2">No content yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create content assets for {clientName} or generate with AI Studio
            </p>
            <Link href="/dashboard/ai/generate">
              <Button size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Content
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {content.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/content/${item.id}`}
                className="block border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getContentIcon(item.asset_type)}
                      <h3 className="text-base font-semibold">
                        {item.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.file_size && (
                        <span>
                          {(item.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.asset_type?.replace('_', ' ') || 'content'}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

