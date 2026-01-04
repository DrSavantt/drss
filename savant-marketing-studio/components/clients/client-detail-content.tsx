'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Globe, Mail, MoreHorizontal, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditClientDialog } from './edit-client-dialog'
import { DeleteClientDialog } from './delete-client-dialog'
import { CreateContentModal } from '@/components/content/create-content-modal'
import { NewProjectDialog } from '@/components/projects/new-project-dialog'

// Tab components - data already loaded, no fetching!
import { ClientOverviewTab } from './tabs/client-overview-tab'
import { ClientProjectsTab } from './tabs/client-projects-tab'
import { ClientContentTab } from './tabs/client-content-tab'
import { ClientQuestionnaireTab } from './tabs/client-questionnaire-tab'
import { ClientAIHistoryTab } from './tabs/client-ai-history-tab'

// ============================================================================
// CLIENT DETAIL CONTENT
// All data pre-fetched server-side. Tabs switch INSTANTLY.
// ============================================================================

interface Client {
  id: string
  name: string
  email?: string
  website?: string
  industry?: string
  status: 'onboarded' | 'onboarding' | 'new'
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

interface QuestionnaireConfig {
  sections: Array<{
    id: number
    key: string
    title: string
    description?: string
    enabled?: boolean
    sort_order: number
  }>
  questions: Array<{
    id: string
    section_id: number
    question_key: string
    text: string
    type: string
    enabled?: boolean
    sort_order: number
    help?: {
      id?: number
      title?: string | null
      where_to_find?: string[] | null
      how_to_extract?: string[] | null
      good_example?: string | null
      weak_example?: string | null
      quick_tip?: string | null
    } | null
  }>
}


interface Activity {
  id: string
  activity_type: string
  entity_name?: string
  metadata?: Record<string, unknown>
  created_at: string
}

interface AIExecution {
  id: string
  client_id?: string | null
  task_type: string
  model_id?: string | null
  input_tokens?: number | null
  output_tokens?: number | null
  total_cost_usd?: number | null
  duration_ms?: number | null
  status?: string | null
  complexity?: string | null
  input_data?: Record<string, unknown> | null
  output_data?: Record<string, unknown> | null
  error_message?: string | null
  created_at: string
}

interface ClientDetailContentProps {
  client: Client
  projects: Array<{
    id: string
    name: string
    description?: string
    status: string
    priority?: string
    due_date?: string
    created_at: string
  }>
  content: Array<{
    id: string
    title: string
    asset_type: string
    file_size?: number
    created_at: string
  }>
  activity: Activity[]
  questionnaireConfig: QuestionnaireConfig
  questionnaireResponseData: Record<string, unknown> | null
  aiExecutions: AIExecution[]
}

export function ClientDetailContent({
  client,
  projects,
  content,
  activity,
  questionnaireConfig,
  questionnaireResponseData,
  aiExecutions
}: ClientDetailContentProps) {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Local state for optimistic updates
  const [localProjects, setLocalProjects] = useState(projects)
  const [localContent, setLocalContent] = useState(content)
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isCreateContentModalOpen, setIsCreateContentModalOpen] = useState(false)
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)

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
              <DropdownMenuItem onClick={() => setIsNewProjectDialogOpen(true)}>
                Add Project
              </DropdownMenuItem>
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

      {/* Tabs - switching is INSTANT because data is already loaded */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({localProjects.length})
          </TabsTrigger>
          <TabsTrigger value="content">
            Content ({localContent.length})
          </TabsTrigger>
          <TabsTrigger value="questionnaire">
            Questionnaire
            {client.questionnaire_status === 'completed' && (
              <span className="ml-1.5 text-green-500">✓</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai">AI History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <ClientOverviewTab
            client={client}
            projects={localProjects}
            content={localContent}
            activity={activity}
            onNewProject={() => setIsNewProjectDialogOpen(true)}
            onNewContent={() => setIsCreateContentModalOpen(true)}
          />
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-6">
          <ClientProjectsTab
            clientId={client.id}
            clientName={client.name}
            projects={localProjects}
            onProjectCreated={(project) => setLocalProjects(prev => [project, ...prev])}
            onProjectDeleted={(id) => setLocalProjects(prev => prev.filter(p => p.id !== id))}
            onNewProject={() => setIsNewProjectDialogOpen(true)}
          />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-6">
          <ClientContentTab
            clientId={client.id}
            clientName={client.name}
            content={localContent}
            onContentCreated={(item) => setLocalContent(prev => [item, ...prev])}
            onContentDeleted={(id) => setLocalContent(prev => prev.filter(c => c.id !== id))}
            onNewContent={() => setIsCreateContentModalOpen(true)}
          />
        </TabsContent>

        {/* Questionnaire Tab - NO LOADING, data already here! */}
        <TabsContent value="questionnaire" className="mt-6">
          <ClientQuestionnaireTab
            clientId={client.id}
            clientName={client.name}
            config={questionnaireConfig}
            responseData={questionnaireResponseData}
            questionnaireStatus={client.questionnaire_status}
            questionnaireCompletedAt={client.questionnaire_completed_at}
            questionnaireToken={client.questionnaire_token}
          />
        </TabsContent>

        {/* AI History Tab - NO LOADING, data already here! */}
        <TabsContent value="ai" className="mt-6">
          <ClientAIHistoryTab
            clientId={client.id}
            executions={aiExecutions}
          />
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
          captures: 0
        }}
      />

      {/* Create Content Modal */}
      <CreateContentModal
        isOpen={isCreateContentModalOpen}
        onClose={() => setIsCreateContentModalOpen(false)}
        clientId={client.id}
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

