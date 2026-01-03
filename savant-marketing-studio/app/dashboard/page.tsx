// Server Component - uses cached queries for faster production loads
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getClientName } from '@/lib/supabase/types'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

// Use ISR with 60 second revalidation instead of force-dynamic
export const revalidate = 60

// Empty data fallback
const emptyData = {
  totalClients: 0,
  totalProjects: 0,
  totalContent: 0,
  projectsByStatus: { backlog: 0, in_progress: 0, in_review: 0, done: 0 },
  urgentItems: [],
  recentActivity: [],
  contentThisWeek: 0,
  activeClients: 0,
  dueThisWeek: 0,
  overdue: 0,
  completionPercentage: 0,
  weeklyContent: 0,
  completedThisMonth: 0,
  storageUsed: 0,
  filesCount: 0,
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted/30 rounded animate-pulse" />
      </div>
      
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
      
      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4 h-96 bg-muted/30 rounded-lg animate-pulse" />
        <div className="lg:col-span-3 h-96 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

// Async component that fetches data
async function DashboardLoader() {
  const supabase = await createClient()

  if (!supabase) {
    return (
      <DashboardContent 
        initialData={emptyData}
        initialClients={[]}
        initialProjects={[]}
        initialContentItems={[]}
      />
    )
  }

  // Fetch all dashboard data in parallel
  const [
    { data: clients },
    { data: projects },
    { data: allContent }
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('projects')
      .select('id, name, status, priority, due_date, created_at, client_id, clients(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('content_assets')
      .select('id, title, asset_type, file_size, file_url, created_at, clients(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
  ])

  // Calculate stats
  const totalClients = clients?.length || 0
  const totalProjects = projects?.length || 0
  const totalContent = allContent?.length || 0

  const projectsByStatus = {
    backlog: projects?.filter(p => p.status === 'backlog').length || 0,
    in_progress: projects?.filter(p => p.status === 'in_progress').length || 0,
    in_review: projects?.filter(p => p.status === 'in_review').length || 0,
    done: projects?.filter(p => p.status === 'done').length || 0,
  }

  const completionPercentage = totalProjects > 0 
    ? Math.round((projectsByStatus.done / totalProjects) * 100)
    : 0

  // Find urgent projects (due in next 3 days)
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const urgentProjects = projects?.filter(p => {
    if (!p.due_date) return false
    const dueDate = new Date(p.due_date)
    return dueDate >= now && dueDate <= threeDaysFromNow && p.status !== 'done'
  }) || []

  const urgentItems = urgentProjects.map(p => ({
    id: p.id,
    title: p.name,
    subtitle: getClientName(p.clients),
    dueDate: p.due_date || undefined,
    href: `/dashboard/projects/board`,
    type: 'project' as const,
  }))

  // Recent activity
  const recentActivity = [
    ...(projects?.slice(0, 5).map(p => ({
      id: p.id,
      title: p.name,
      type: 'project' as const,
      client: getClientName(p.clients),
      created_at: p.created_at,
      href: `/dashboard/projects/board`,
    })) || []),
    ...(allContent?.slice(0, 5).map(c => ({
      id: c.id,
      title: c.title,
      type: 'content' as const,
      client: getClientName(c.clients),
      created_at: c.created_at,
      href: `/dashboard/content/${c.id}`,
    })) || []),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  // Calculate metrics
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const contentThisWeek = allContent?.filter(c => 
    new Date(c.created_at) >= sevenDaysAgo
  ).length || 0

  const weeklyContent = allContent?.filter(c => 
    new Date(c.created_at) >= sevenDaysAgo
  ).length || 0

  const completedThisMonth = projects?.filter(p => 
    p.status === 'done' && new Date(p.created_at) >= monthStart
  ).length || 0

  const storageUsed = Math.round(
    (allContent?.reduce((sum, c) => sum + (c.file_size || 0), 0) || 0) / 1024 / 1024
  )
  const filesCount = allContent?.filter(c => c.file_url).length || 0

  const activeClients = clients?.filter(c => 
    projects?.some(p => p.client_id === c.id && p.status !== 'done')
  ).length || 0

  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueThisWeek = projects?.filter(p => {
    if (!p.due_date) return false
    const dueDate = new Date(p.due_date)
    return dueDate >= now && dueDate <= oneWeekFromNow && p.status !== 'done'
  }).length || 0

  const overdue = projects?.filter(p => {
    if (!p.due_date) return false
    const dueDate = new Date(p.due_date)
    return dueDate < now && p.status !== 'done'
  }).length || 0

  // Prepare data for the client component
  const dashboardData = {
    totalClients,
    totalProjects,
    totalContent,
    projectsByStatus,
    urgentItems,
    recentActivity,
    contentThisWeek,
    activeClients,
    dueThisWeek,
    overdue,
    completionPercentage,
    weeklyContent,
    completedThisMonth,
    storageUsed,
    filesCount,
  }

  // Transform clients for mention popup
  const clientsForMention = (clients || []).map(c => ({ 
    id: c.id, 
    name: c.name 
  }))

  // Transform projects for mention popup
  const projectsForMention = (projects || []).map(p => ({
    id: p.id,
    name: p.name,
    clientName: getClientName(p.clients)
  }))

  // Transform content for mention popup
  const contentForMention = (allContent || []).map(c => ({
    id: c.id,
    title: c.title,
    clientName: getClientName(c.clients)
  }))
  
  return (
    <DashboardContent 
      initialData={dashboardData}
      initialClients={clientsForMention}
      initialProjects={projectsForMention}
      initialContentItems={contentForMention}
    />
  )
}

// Main page with streaming
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLoader />
    </Suspense>
  )
}
