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
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-64 bg-muted/30 rounded animate-pulse" />
            <div className="h-6 w-20 bg-muted/30 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-48 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-muted/30 rounded animate-pulse" />
          <div className="h-9 w-9 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
      
      {/* Main content area skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
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
    contentCountResult,
    aiCountResult
  ] = await Promise.all([
    // Project with client details
    supabase
      .from('projects')
      .select('*, clients(id, name, email, industry)')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    
    // Content assets count for this project
    supabase
      .from('content_assets')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)
      .is('deleted_at', null),
    
    // AI executions count for this project
    supabase
      .from('ai_executions')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)
  ])

  // Handle not found
  if (projectResult.error || !projectResult.data) {
    notFound()
  }

  const project = projectResult.data as ProjectWithClient
  const contentCount = contentCountResult.count ?? 0
  const aiCount = aiCountResult.count ?? 0

  // Build project with computed counts
  const projectWithCounts = {
    ...project,
    contentCount,
    aiCount
  }

  // For now, render basic shell with data preview
  // We'll add ProjectDetailContent component next
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
        <h1 className="text-2xl font-bold">{project.name}</h1>
        
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
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Content Assets</p>
          <p className="text-2xl font-bold">{contentCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">AI Generations</p>
          <p className="text-2xl font-bold">{aiCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Due Date</p>
          <p className="text-2xl font-bold">
            {project.due_date 
              ? new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—'}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="text-2xl font-bold">
            {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
      
      {/* Description - Inline Editable */}
      <ProjectDescription 
        projectId={project.id} 
        description={project.description} 
      />
      
      {/* Quick Captures - Journal entries mentioning this project */}
      <ProjectCaptures projectId={project.id} projectName={project.name} />
      
      {/* Debug data - remove in production */}
      <details className="rounded-lg border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Debug: Raw Project Data</summary>
        <pre className="mt-4 text-xs overflow-auto p-4 bg-muted/50 rounded">
          {JSON.stringify(projectWithCounts, null, 2)}
        </pre>
      </details>
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
