import { createClient } from '@/lib/supabase/server'
import { getClientName } from '@/lib/supabase/types'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Fetch all data
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, priority, due_date, created_at, client_id, clients(name)')
    .order('created_at', { ascending: false })

  const { data: content } = await supabase
    .from('content_assets')
    .select('id, title, asset_type, created_at, clients(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate stats
  const totalClients = clients?.length || 0
  const totalProjects = projects?.length || 0
  const totalContent = content?.length || 0

  const projectsByStatus = {
    backlog: projects?.filter(p => p.status === 'backlog').length || 0,
    in_progress: projects?.filter(p => p.status === 'in_progress').length || 0,
    in_review: projects?.filter(p => p.status === 'in_review').length || 0,
    done: projects?.filter(p => p.status === 'done').length || 0,
  }

  // Calculate completion percentage
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

  // Map urgent items
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
    ...(content?.slice(0, 5).map(c => ({
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

  // Calculate "this week" metrics
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const projectsThisWeek = projects?.filter(p => 
    new Date(p.created_at) >= oneWeekAgo
  ).length || 0
  const contentThisWeek = content?.filter(c =>
    new Date(c.created_at) >= oneWeekAgo
  ).length || 0

  const totalActivityThisWeek = projectsThisWeek + contentThisWeek

  // Fetch all content for storage calculation
  const { data: allContent } = await supabase
    .from('content_assets')
    .select('id, file_size, file_url, created_at')

  // Calculate performance metrics
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Weekly content
  const weeklyContent = allContent?.filter(c => 
    new Date(c.created_at) >= sevenDaysAgo
  ).length || 0

  // Completed this month
  const completedThisMonth = projects?.filter(p => 
    p.status === 'done' && new Date(p.created_at) >= monthStart
  ).length || 0

  // Storage used
  const storageUsed = Math.round(
    (allContent?.reduce((sum, c) => sum + (c.file_size || 0), 0) || 0) / 1024 / 1024
  )
  const filesCount = allContent?.filter(c => c.file_url).length || 0

  // Active vs inactive clients
  const activeClients = clients?.filter(c => 
    projects?.some(p => p.client_id === c.id && p.status !== 'done')
  ).length || 0
  const inactiveClients = totalClients - activeClients

  // Due this week
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueThisWeek = projects?.filter(p => {
    if (!p.due_date) return false
    const dueDate = new Date(p.due_date)
    return dueDate >= now && dueDate <= oneWeekFromNow && p.status !== 'done'
  }).length || 0

  // Overdue
  const overdue = projects?.filter(p => {
    if (!p.due_date) return false
    const dueDate = new Date(p.due_date)
    return dueDate < now && p.status !== 'done'
  }).length || 0

  // Content types breakdown
  const contentTypes = {
    note: allContent?.filter(c => c.asset_type === 'note').length || 0,
    file: allContent?.filter(c => c.file_url).length || 0,
  }

  return NextResponse.json({
    totalClients,
    totalProjects,
    totalContent,
    projectsByStatus,
    completionPercentage,
    urgentItems,
    recentActivity,
    totalActivityThisWeek,
    projectsThisWeek,
    contentThisWeek,
    // Performance metrics
    weeklyContent,
    completedThisMonth,
    completionRate: completionPercentage,
    storageUsed,
    filesCount,
    activeClients,
    inactiveClients,
    dueThisWeek,
    overdue,
    contentTypes,
  })
}

