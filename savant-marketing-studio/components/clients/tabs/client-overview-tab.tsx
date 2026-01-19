'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderKanban, FileText, Sparkles, Zap, Calendar, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { QuestionnaireStatusCard } from '../questionnaire-status-card'
import { ClientCaptures } from '../client-captures'

// ============================================================================
// CLIENT OVERVIEW TAB
// All data pre-fetched. No API calls on mount.
// ============================================================================

interface Client {
  id: string
  name: string
  industry?: string
  projectCount: number
  contentCount: number
  aiCalls: number
  aiSpend: number
  brandVoice?: string
  targetAudience?: string
  questionnaire_status?: 'not_started' | 'in_progress' | 'completed' | null
  questionnaire_token?: string | null
  questionnaire_completed_at?: string | null
}

interface Activity {
  id: string
  activity_type: string
  entity_name?: string
  metadata?: Record<string, unknown>
  created_at: string
}

interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority?: string
  due_date?: string
  created_at: string
}

interface ContentItem {
  id: string
  title: string
  asset_type: string
  file_size?: number
  created_at: string
}

interface ClientOverviewTabProps {
  client: Client
  projects: Project[]
  content: ContentItem[]
  activity: Activity[]
  onNewProject: () => void
  onNewContent: () => void
}

function formatActivityText(activity: Activity): string {
  const name = activity.entity_name || 'Item'
  
  switch (activity.activity_type) {
    case 'project_created':
      return `Project created: ${name}`
    case 'project_status_changed':
      return `Project moved to ${activity.metadata?.new_status}`
    case 'content_created':
      return `Content created: ${name}`
    case 'content_reassigned':
      return `Content reassigned: ${name}`
    case 'questionnaire_updated':
      return 'Questionnaire updated'
    case 'questionnaire_completed':
      return 'Questionnaire completed'
    case 'research_created':
      return `Research saved: ${name}`
    case 'bulk_delete':
      return `Bulk delete: ${activity.metadata?.count || 'multiple'} items`
    case 'bulk_move':
      return `Bulk move: ${activity.metadata?.count || 'multiple'} items`
    case 'bulk_reassign':
      return `Bulk reassign: ${activity.metadata?.count || 'multiple'} items`
    case 'chat_linked':
      return `Chat linked: ${name}`
    case 'chat_summarized':
      return `Chat summarized: ${name}`
    default:
      return activity.activity_type.replace(/_/g, ' ')
  }
}

export function ClientOverviewTab({
  client,
  projects,
  content,
  activity,
  onNewProject,
  onNewContent
}: ClientOverviewTabProps) {
  // Format activity for display
  const recentActivity = activity.slice(0, 4).map(a => ({
    action: formatActivityText(a),
    time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true })
  }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Projects" value={client.projectCount} icon={FolderKanban} />
        <StatCard title="Content Pieces" value={client.contentCount} icon={FileText} />
        <StatCard title="AI Calls" value={client.aiCalls} icon={Zap} />
        <StatCard title="AI Spend" value={`$${client.aiSpend.toFixed(2)}`} icon={Sparkles} />
      </div>

      {/* Questionnaire Status - Prominent placement */}
      <QuestionnaireStatusCard
        clientId={client.id}
        clientName={client.name}
        status={client.questionnaire_status || null}
        completedAt={client.questionnaire_completed_at}
        questionnaireToken={client.questionnaire_token}
      />

      {/* Quick Captures - Client-specific journal notes */}
      <ClientCaptures clientId={client.id} clientName={client.name} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions for this client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                recentActivity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">{item.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Brand Summary */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Brand Summary</CardTitle>
            <CardDescription>Key brand attributes from questionnaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Brand Voice</p>
                <p className="mt-1">{client.brandVoice || 'Not yet defined'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <p className="mt-1">{client.industry || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Target Audience</p>
                <p className="mt-1">{client.targetAudience || 'Not yet defined'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects Preview */}
      {projects.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Latest projects for {client.name}</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={onNewProject}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.slice(0, 3).map((project) => (
                <Link
                  key={project.id}
                  href="/dashboard/projects/board"
                  className="block border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          project.status === 'done' && "bg-green-500",
                          project.status === 'in_progress' && "bg-blue-500",
                          project.status === 'in_review' && "bg-yellow-500",
                          project.status === 'backlog' && "bg-gray-400"
                        )} />
                        <h3 className="text-base font-semibold">
                          {project.name}
                        </h3>
                      </div>
                      
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {project.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span>
                          Created {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={
                        project.priority === 'urgent' ? 'destructive' :
                        project.priority === 'high' ? 'default' :
                        'secondary'
                      }>
                        {project.priority || 'normal'}
                      </Badge>
                      <Badge variant="outline">
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

