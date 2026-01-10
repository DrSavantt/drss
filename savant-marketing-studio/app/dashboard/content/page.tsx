// Server Component - uses ISR (Incremental Static Regeneration) for caching
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ContentPageContent } from '@/components/content/content-page-content'

// ISR: Cache page for 60 seconds, then revalidate in background
export const revalidate = 60

// Helper: Map database asset_type to UI type
function mapContentType(assetType: string): "email" | "ad" | "landing" | "blog" | "note" {
  const typeMap: Record<string, "email" | "ad" | "landing" | "blog" | "note"> = {
    'email': 'email',
    'ad_copy': 'ad',
    'landing_page': 'landing',
    'blog_post': 'blog',
    'note': 'note',
    'research_pdf': 'note',
    'research_report': 'note',
    'other': 'note',
  }
  return typeMap[assetType] || 'note'
}

// Helper: Extract preview text from content
function extractPreview(content: any): string {
  try {
    const contentJson = content.content_json
    
    if (!contentJson) {
      return content.title || 'No preview available'
    }
    
    if (typeof contentJson === 'string') {
      return contentJson.substring(0, 100)
    }
    
    if (typeof contentJson === 'object') {
      if (typeof contentJson.text === 'string') {
        return contentJson.text.substring(0, 100)
      }
      
      if (contentJson.content) {
        if (typeof contentJson.content === 'string') {
          return contentJson.content.substring(0, 100)
        }
        
        if (Array.isArray(contentJson.content)) {
          const firstTextNode = contentJson.content.find(
            (node: any) => node.type === 'paragraph' && node.content
          )
          if (firstTextNode?.content?.[0]?.text) {
            return String(firstTextNode.content[0].text).substring(0, 100)
          }
        }
      }
      
      const stringified = JSON.stringify(contentJson)
      if (stringified.length > 2) {
        return stringified.substring(0, 100)
      }
    }
    
    return content.title || 'No preview available'
  } catch (error) {
    console.error('Error extracting preview:', error)
    return content.title || 'No preview available'
  }
}

// Loading skeleton
function ContentListSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted/30 rounded animate-pulse" />
      </div>
      
      <div className="flex gap-2">
        <div className="h-10 w-64 bg-muted/30 rounded animate-pulse" />
        <div className="h-10 w-24 bg-muted/30 rounded animate-pulse" />
        <div className="h-10 w-24 bg-muted/30 rounded animate-pulse" />
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// Async component that fetches data
async function ContentListLoader() {
  const supabase = await createClient()

  if (!supabase) {
    return <ContentPageContent initialContent={[]} initialClients={[]} initialProjects={[]} />
  }

  // Fetch content, clients, and projects in parallel
  const [contentResult, clientsResult, projectsResult] = await Promise.all([
    supabase
      .from('content_assets')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .eq('is_archived', false)
      .is('deleted_at', null)  // Exclude soft-deleted content
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('projects')
      .select('id, name, clients(name)')
      .is('deleted_at', null)
      .order('name')
  ])

  const { data: content, error: contentError } = contentResult
  const { data: clients, error: clientsError } = clientsResult
  const { data: projects, error: projectsError } = projectsResult

  if (contentError) {
    console.error('Error fetching content:', contentError)
  }

  if (clientsError) {
    console.error('Error fetching clients:', clientsError)
  }

  if (projectsError) {
    console.error('Error fetching projects:', projectsError)
  }

  // Transform content to UI format
  const transformedContent = (content || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    type: mapContentType(c.asset_type),
    client: c.clients?.name || 'Unknown',
    clientId: c.client_id || '',
    preview: extractPreview(c),
    createdAt: new Date(c.created_at),
    aiGenerated: !!c.metadata?.ai_generated || false,
  }))

  // Transform clients for filter dropdown
  const transformedClients = (clients || []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }))

  // Transform projects for Move To dropdown
  const transformedProjects = (projects || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    clientName: p.clients?.name || null,
  }))

  return (
    <ContentPageContent 
      initialContent={transformedContent} 
      initialClients={transformedClients}
      initialProjects={transformedProjects}
    />
  )
}

// Main page with streaming
export default function ContentPage() {
  return (
    <Suspense fallback={<ContentListSkeleton />}>
      <ContentListLoader />
    </Suspense>
  )
}
