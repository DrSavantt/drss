// Server Component - uses ISR (Incremental Static Regeneration) for caching
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ClientsPageContent } from '@/components/clients/clients-page-content'

// ISR: Cache page for 60 seconds, then revalidate in background
export const revalidate = 60

// Loading skeleton for Suspense
function ClientListSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted/30 rounded animate-pulse" />
      </div>
      
      {/* Filters */}
      <div className="flex gap-2">
        <div className="h-10 w-64 bg-muted/30 rounded animate-pulse" />
        <div className="h-10 w-24 bg-muted/30 rounded animate-pulse" />
      </div>
      
      {/* Client cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// Async component that fetches data
async function ClientListLoader() {
  const supabase = await createClient()

  if (!supabase) {
    return <ClientsPageContent initialClients={[]} />
  }

  // Fetch clients with related counts in one optimized query (migrated to ai_executions)
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      projects(id, deleted_at),
      content_assets(id, deleted_at),
      ai_executions(total_cost_usd)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    return <ClientsPageContent initialClients={[]} />
  }

  // Transform the response to match the UI format
  const clientsWithStats = (clients || []).map(client => {
    // Count projects (exclude soft-deleted)
    const projectCount = Array.isArray(client.projects) 
      ? client.projects.filter((p: any) => !p.deleted_at).length 
      : 0
    
    // Count content (exclude soft-deleted)
    const contentCount = Array.isArray(client.content_assets) 
      ? client.content_assets.filter((c: any) => !c.deleted_at).length 
      : 0
    
    // Calculate AI spend from ai_executions array (migrated from ai_generations)
    const aiSpend = Array.isArray(client.ai_executions)
      ? client.ai_executions.reduce(
          (sum: number, exec: { total_cost_usd: number | null }) => sum + (exec.total_cost_usd || 0),
          0
        )
      : 0
    
    // Map questionnaire_status to status field for v0 compatibility
    let status: "onboarded" | "onboarding" | "new" = "new"
    if (client.questionnaire_status === 'completed') {
      status = "onboarded"
    } else if (client.questionnaire_status === 'in_progress') {
      status = "onboarding"
    }

    return {
      id: client.id,
      name: client.name,
      email: client.email || '',
      status,
      projectCount,
      contentCount,
      aiSpend: Math.round(aiSpend * 100) / 100,
      industry: client.industry || 'Not specified',
    }
  })

  return <ClientsPageContent initialClients={clientsWithStats} />
}

// Main page with streaming
export default function ClientsPage() {
  return (
    <Suspense fallback={<ClientListSkeleton />}>
      <ClientListLoader />
    </Suspense>
  )
}
