import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Get user's clients for filtering (exclude soft-deleted)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { data: userClients } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
  
  const clientIds = userClients?.map(c => c.id) || []
  
  // ============================================
  // STAT CARDS DATA (Totals & Growth)
  // ============================================
  
  // Total clients (exclude soft-deleted)
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)
  
  // Active projects (not done, exclude soft-deleted)
  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clientIds)
    .is('deleted_at', null)
    .neq('status', 'done')
  
  // Total content (exclude soft-deleted)
  const { count: totalContent } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clientIds)
    .is('deleted_at', null)
  
  // Journal entries count
  const { data: journalCount } = await supabase.rpc('count_journal_entries')
  
  // Client growth calculation
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  
  const { count: clientsThisMonth } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  const { count: clientsLastMonth } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString())
  
  const clientGrowth = clientsLastMonth && clientsLastMonth > 0
    ? Math.round(((clientsThisMonth || 0) - clientsLastMonth) / clientsLastMonth * 100)
    : 0
  
  // Content by type breakdown (exclude soft-deleted)
  const { data: contentAssets } = await supabase
    .from('content_assets')
    .select('asset_type')
    .in('client_id', clientIds)
    .is('deleted_at', null)
  
  const contentByType: Record<string, number> = {}
  contentAssets?.forEach(item => {
    const type = item.asset_type || 'other'
    contentByType[type] = (contentByType[type] || 0) + 1
  })
  
  // Projects by status breakdown (exclude soft-deleted)
  const { data: projects } = await supabase
    .from('projects')
    .select('status')
    .in('client_id', clientIds)
    .is('deleted_at', null)
  
  const projectsByStatus: Record<string, number> = {}
  projects?.forEach(item => {
    const status = item.status || 'unknown'
    projectsByStatus[status] = (projectsByStatus[status] || 0) + 1
  })
  
  // CLIENT GROWTH TREND (exclude soft-deleted)
  const { data: clientsData } = await supabase
    .from('clients')
    .select('created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })
  
  const clientTrend = processTimeSeries(clientsData || [], days, true) // cumulative
  
  // PROJECTS COMPLETED TREND (exclude soft-deleted)
  const { data: projectsData } = await supabase
    .from('projects')
    .select('updated_at, status')
    .in('client_id', clientIds)
    .is('deleted_at', null)
    .eq('status', 'done')
    .gte('updated_at', startDate.toISOString())
    .order('updated_at', { ascending: true })
  
  const projectsTrend = processTimeSeries(projectsData || [], days, false)
  
  // CONTENT CREATED TREND (exclude soft-deleted)
  const { data: contentData } = await supabase
    .from('content_assets')
    .select('created_at')
    .in('client_id', clientIds)
    .is('deleted_at', null)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })
  
  const contentTrend = processTimeSeries(contentData || [], days, false)
  
  // DAILY ACTIVITY TREND
  const { data: activityData } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })
  
  const activityTrend = processTimeSeries(activityData || [], days, false)
  
  return NextResponse.json({
    // Stat cards data
    stats: {
      totalClients: totalClients || 0,
      activeProjects: activeProjects || 0,
      totalContent: totalContent || 0,
      journalEntries: journalCount || 0,
      clientGrowth,
      contentByType,
      projectsByStatus
    },
    // Time series charts
    clientGrowth: clientTrend,
    projectsCompleted: projectsTrend,
    contentCreated: contentTrend,
    dailyActivity: activityTrend
  })
}

function processTimeSeries(
  data: Array<{ created_at?: string; updated_at?: string }>,
  days: number,
  cumulative: boolean
): Array<{ date: string; value: number }> {
  const result: { [key: string]: number } = {}
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Initialize all dates with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    result[dateStr] = 0
  }
  
  // Count occurrences per day
  data.forEach(item => {
    const timestamp = item.created_at || item.updated_at
    if (!timestamp) return
    const dateStr = timestamp.split('T')[0]
    if (result[dateStr] !== undefined) {
      result[dateStr]++
    }
  })
  
  // Convert to array and apply cumulative if needed
  const sorted = Object.entries(result)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }))
  
  if (cumulative) {
    let sum = 0
    return sorted.map(item => {
      sum += item.value
      return { ...item, value: sum }
    })
  }
  
  return sorted
}
