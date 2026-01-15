// Server Component - NO 'use client'
// Fetches project data and related counts server-side
// Uses ISR for caching at the page level

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ProjectDetailActions } from '@/components/projects/project-detail-actions'
import { ProjectCaptures } from '@/components/projects/project-captures'
import { ProjectProperties } from '@/components/projects/project-properties'
import { ProjectDescription } from '@/components/projects/project-description'
import { ProjectRelations } from '@/components/projects/project-relations'
import { ProjectContent } from '@/components/projects/project-content'
import { ProjectAIGenerations } from '@/components/projects/project-ai-generations'
import { ChevronLeft } from 'lucide-react'

// ISR: Cache page for 30 seconds, then revalidate in background
export const revalidate = 30

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

// Dynamic metadata based on project name
export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  if (!supabase) {
    return { title: 'Project' }
  }
  
  const { data } = await supabase
    .from('projects')
    .select('name')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  
  return { 
    title: data?.name ?? 'Project',
    description: `Project details for ${data?.name ?? 'project'}`
  }
}

// Loading skeleton for Suspense
function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back link skeleton */}
      <div className="h-4 w-40 bg-muted/30 rounded animate-pulse" />
      
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-64 bg-muted/30 rounded animate-pulse" />
          <div className="h-5 w-32 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-24 bg-muted/30 rounded-full animate-pulse" />
          <div className="h-7 w-20 bg-muted/30 rounded-full animate-pulse" />
          <div className="h-7 w-28 bg-muted/30 rounded-full animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-muted/30 rounded animate-pulse" />
      </div>
      
      {/* Relations badges skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 w-28 bg-muted/30 rounded-full animate-pulse" />
        ))}
      </div>
      
      {/* Description skeleton */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
        <div className="h-16 w-full bg-muted/30 rounded animate-pulse" />
      </div>
      
      {/* Content section skeleton */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-muted/30 rounded animate-pulse" />
            <div className="h-5 w-8 bg-muted/30 rounded-full animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      {/* AI section skeleton */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-6 w-32 bg-muted/30 rounded animate-pulse" />
            <div className="h-5 w-8 bg-muted/30 rounded-full animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      {/* Captures section skeleton */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted/30 rounded-lg animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-28 bg-muted/30 rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Project data type with client relation
interface ProjectWithClient {
  id: string
  client_id: string | null
  name: string
  description: string | null
  status: 'backlog' | 'in_progress' | 'in_review' | 'done'
  due_date: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  position: number
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  clients: {
    id: string
    name: string
    email: string | null
    industry: string | null
  } | null
}

// Async component that fetches project-specific data
async function ProjectDetailLoader({ id }: { id: string }) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection failed')
  }

  // Fetch ALL data in ONE parallel request
  const [
    projectResult,
    contentItemsResult,
    aiCountResult,
    capturesCountResult
  ] = await Promise.all([
    // Project with client details
    supabase
      .from('projects')
      .select('*, clients(id, name, email, industry)')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    
    // Content assets for this project (full items, not just count)
    supabase
      .from('content_assets')
      .select('id, title, asset_type, updated_at')
      .eq('project_id', id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(15),
    
    // AI executions for this project (full items, not just count)
    supabase
      .from('ai_executions')
      .select('id, generation_type, model_used, tokens_used, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    
    // Journal entries mentioning this project
    supabase
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .contains('project_mentions', [id])
      .is('deleted_at', null)
  ])

  // Handle not found
  if (projectResult.error || !projectResult.data) {
    notFound()
  }

  const project = projectResult.data as ProjectWithClient
  const contentItems = contentItemsResult.data ?? []
  const contentCount = contentItems.length
  const aiGenerations = aiCountResult.data ?? []
  const aiCount = aiGenerations.length
  const capturesCount = capturesCountResult.count ?? 0

  return (
    <div className="space-y-6">
      {/* Top bar: Back link + Actions */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/projects/board" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>
        
        <ProjectDetailActions 
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            priority: project.priority,
            due_date: project.due_date,
            client_id: project.client_id
          }}
        />
      </div>
      
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <span className="text-xs text-muted-foreground">
            Created {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        
        {/* Inline Editable Properties */}
        <ProjectProperties
          projectId={project.id}
          status={project.status}
          priority={project.priority}
          dueDate={project.due_date}
        />
        
        {project.clients && (
          <p className="text-sm text-muted-foreground">
            Client: <Link href={`/dashboard/clients/${project.clients.id}`} className="hover:underline">{project.clients.name}</Link>
            {project.clients.industry && ` • ${project.clients.industry}`}
          </p>
        )}
      </div>
      
      {/* Relations badges - clickable scroll links */}
      <ProjectRelations 
        contentCount={contentCount} 
        aiCount={aiCount} 
        capturesCount={capturesCount} 
      />
      
      {/* Description - Inline Editable */}
      <ProjectDescription 
        projectId={project.id} 
        description={project.description} 
      />
      
      {/* Content Assets Section */}
      <ProjectContent projectId={project.id} content={contentItems} />
      
      {/* AI Generations Section */}
      <ProjectAIGenerations projectId={project.id} aiGenerations={aiGenerations} />
      
      {/* Quick Captures - Journal entries mentioning this project */}
      <ProjectCaptures projectId={project.id} projectName={project.name} />
    </div>
  )
}

// Main page with streaming
export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params
  
  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectDetailLoader id={id} />
    </Suspense>
  )
}
