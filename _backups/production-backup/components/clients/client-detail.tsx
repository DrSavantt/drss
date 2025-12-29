"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Globe, Mail, MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatCard } from "@/components/ui/stat-card"
import { FolderKanban, FileText, Sparkles, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientQuestionnaire } from "./client-questionnaire"
import { EditClientDialog } from "./edit-client-dialog"
import { DeleteClientDialog } from "./delete-client-dialog"
import { CopyQuestionnaireLink } from "../copy-questionnaire-link"
import { formatDistanceToNow } from "date-fns"

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
}

interface Activity {
  action: string
  time: string
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [client, setClient] = useState<Client | null>(null)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchClientData() {
      try {
        // Fetch client details
        const clientRes = await fetch(`/api/clients/${clientId}`)
        const clientData = await clientRes.json()
        
        // Fetch recent activity for this client
        const activityRes = await fetch(`/api/activity-log?client_id=${clientId}&limit=4`)
        const activities = await activityRes.json()
        
        setClient(clientData)
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
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
          <TabsTrigger value="ai">AI History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Projects" value={client.projectCount} icon={FolderKanban} />
            <StatCard title="Content Pieces" value={client.contentCount} icon={FileText} />
            <StatCard title="AI Calls" value={client.aiCalls} icon={Zap} />
            <StatCard title="AI Spend" value={`$${client.aiSpend.toFixed(2)}`} icon={Sparkles} />
          </div>

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
                <Button size="sm">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Projects will appear here</p>
                <p className="text-sm text-muted-foreground">View all projects in the Projects tab</p>
              </div>
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
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  New Content
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Content assets will appear here</p>
                <p className="text-sm text-muted-foreground">Generate content in AI Studio</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questionnaire" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Questionnaire</h2>
                <p className="text-sm text-muted-foreground">Client onboarding and brand discovery</p>
              </div>
              <CopyQuestionnaireLink clientId={clientId} />
            </div>
            <ClientQuestionnaire clientName={client.name} />
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>AI Generation History</CardTitle>
              <CardDescription>All AI-generated content for {client.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">AI generation history will appear here</p>
                <p className="text-sm text-muted-foreground">Track usage and costs per generation</p>
              </div>
            </CardContent>
          </Card>
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

