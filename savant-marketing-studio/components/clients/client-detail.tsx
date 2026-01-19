"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Globe, Mail, MoreHorizontal, Pencil, Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { ScrollableTabsList } from '@/components/ui/scrollable-tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatCard } from "@/components/ui/stat-card"
import { FolderKanban, FileText, Sparkles, Zap } from "lucide-react"
import { getContentTypeConfig } from "@/lib/content-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientQuestionnaire } from "./client-questionnaire"
import { EditClientDialog } from "./edit-client-dialog"
import { DeleteClientDialog } from "./delete-client-dialog"
import { CopyQuestionnaireLink } from "../copy-questionnaire-link"
import { ClientCaptures } from "./client-captures"
import { QuestionnaireStatusCard } from "./questionnaire-status-card"
import { CreateContentModal } from "@/components/content/create-content-modal"
import { NewProjectDialog } from "@/components/projects/new-project-dialog"
import { AIHistoryTab } from "./ai-history-tab"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

// ============================================================================
// EXACT v0 CODE - Only data fetching added
// ============================================================================

interface ClientDetailProps {
  clientId: string
}

interface Client {
  id: string
  name: string
  email: string
  website: string
  status: "onboarded" | "onboarding" | "new"
  industry: string
  projectCount: number
  contentCount: number
  aiCalls: number
  aiSpend: number
  brandVoice: string
  targetAudience: string
  questionnaire_status?: 'not_started' | 'in_progress' | 'completed' | null
  questionnaire_token?: string | null
  questionnaire_completed_at?: string | null
}

interface Activity {
  action: string
  time: string
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [client, setClient] = useState<Client | null>(null)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isCreateContentModalOpen, setIsCreateContentModalOpen] = useState(false)
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchClientData() {
      try {
        // Fetch client details
        const clientRes = await fetch(`/api/clients/${clientId}`)
        const clientData = await clientRes.json()
        
        // Fetch recent activity for this client
        const activityRes = await fetch(`/api/activity-log?client_id=${clientId}&limit=4`)
        const activities = await activityRes.json()
        
        // Fetch projects for this client
        const projectsRes = await fetch(`/api/projects`)
        const allProjects = await projectsRes.json()
        const clientProjects = allProjects.filter((p: any) => p.client_id === clientId)
        
        // Fetch content for this client
        const contentRes = await fetch(`/api/content`)
        const allContent = await contentRes.json()
        const clientContent = allContent.filter((c: any) => c.client_id === clientId)
        
        setClient(clientData)
        setProjects(clientProjects)
        setContent(clientContent)
        setRecentActivity(activities.map((a: any) => ({
          action: formatActivityText(a),
          time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true })
        })))
      } catch (error) {
        console.error('Failed to fetch client:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClientData()
  }, [clientId])

  if (loading || !client) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-muted/20 rounded animate-pulse" />
        <div className="h-24 bg-muted/20 rounded animate-pulse" />
        <div className="h-96 bg-muted/20 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {client.status === 'onboarded' ? 'Onboarding Complete' : client.status === 'onboarding' ? 'Onboarding' : 'New'}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              {client.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </span>
              )}
              {client.website && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {client.website}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Generate Content</DropdownMenuItem>
              <DropdownMenuItem>Add Project</DropdownMenuItem>
              <DropdownMenuItem>Export Data</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Archive Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollableTabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
          <TabsTrigger value="ai">AI History</TabsTrigger>
        </ScrollableTabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Projects" value={client.projectCount} icon={FolderKanban} />
            <StatCard title="Content Pieces" value={client.contentCount} icon={FileText} />
            <StatCard title="AI Calls" value={client.aiCalls} icon={Zap} />
            <StatCard title="AI Spend" value={`$${client.aiSpend.toFixed(2)}`} icon={Sparkles} />
          </div>

          {/* Questionnaire Status - Prominent placement */}
          <QuestionnaireStatusCard
            clientId={clientId}
            clientName={client.name}
            status={client.questionnaire_status || null}
            completedAt={client.questionnaire_completed_at}
            questionnaireToken={client.questionnaire_token}
          />

          {/* Quick Captures - Client-specific journal notes */}
          <ClientCaptures clientId={clientId} clientName={client.name} />

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
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="text-sm">{activity.action}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
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
                    <p className="mt-1">{client.industry}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Audience</p>
                    <p className="mt-1">{client.targetAudience || 'Not yet defined'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>All projects for {client.name}</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsNewProjectDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-base font-medium mb-2">No projects yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Get started by creating your first project for {client.name}
                  </p>
                  <Link href="/dashboard/projects/board">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project: any) => (
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
                            {project.priority}
                          </Badge>
                          <Badge variant="outline">
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {projects.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('projects')}>
                        View all {projects.length} projects
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content Library</CardTitle>
                  <CardDescription>All content assets for {client.name}</CardDescription>
                </div>
                <Button 
                  size="sm"
                  onClick={() => setIsCreateContentModalOpen(true)}
                >
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
                    Create content assets for {client.name} or generate with AI Chat
                  </p>
                  <Link href="/dashboard/ai/chat">
                    <Button size="sm">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Content
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {content.slice(0, 5).map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/dashboard/content/${item.id}`}
                      className="block border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Content type icon */}
                            {(() => {
                              const config = getContentTypeConfig(item.asset_type);
                              const Icon = config.icon;
                              return <Icon className={`h-4 w-4 ${config.color}`} />;
                            })()}
                            
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
                  
                  {content.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('content')}>
                        View all {content.length} items
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questionnaire" className="mt-6">
          <ClientQuestionnaire 
            clientId={clientId}
            clientName={client.name}
            questionnaireStatus={client.questionnaire_status}
            questionnaireCompletedAt={client.questionnaire_completed_at}
            questionnaireToken={client.questionnaire_token}
          />
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <AIHistoryTab clientId={clientId} />
        </TabsContent>
      </Tabs>

      {/* Edit Client Dialog */}
      <EditClientDialog 
        client={client} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
      />

      {/* Delete Client Dialog */}
      <DeleteClientDialog
        client={client}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        relatedCounts={{
          projects: client.projectCount || 0,
          content: client.contentCount || 0,
          captures: 0  // Could be fetched from API if needed
        }}
      />

      {/* Create Content Modal */}
      <CreateContentModal
        isOpen={isCreateContentModalOpen}
        onClose={() => setIsCreateContentModalOpen(false)}
        clientId={clientId}
        clientName={client.name}
      />

      {/* New Project Dialog */}
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        defaultClientId={client.id}
        defaultClientName={client.name}
      />
    </div>
  )
}

function formatActivityText(activity: any): string {
  const name = activity.entity_name || 'Item'
  
  switch (activity.activity_type) {
    case 'project_created':
      return `Project created: ${name}`
    case 'project_status_changed':
      return `Project moved to ${activity.metadata?.new_status}`
    case 'content_created':
      return `Content created: ${name}`
    case 'questionnaire_updated':
      return 'Questionnaire updated'
    case 'questionnaire_completed':
      return 'Questionnaire completed'
    default:
      return activity.activity_type.replace(/_/g, ' ')
  }
}

