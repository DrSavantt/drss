import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  const clientId = searchParams.get('clientId') // 'all' or UUID
  
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Get user's clients for filtering (exclude soft-deleted)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Build client IDs array based on filter
  let clientIds: string[] = []
  
  if (clientId && clientId !== 'all') {
    // Filter to specific client - verify it belongs to the user
    const { data: verifyClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()
    
    if (verifyClient) {
      clientIds = [clientId]
    } else {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
  } else {
    // Get all user's clients
    const { data: userClients } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
    
    clientIds = userClients?.map(c => c.id) || []
  }
  
  // Helper dates
  const today = new Date().toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  
  // Helper function to check if filtering by specific client
  const isFilteringByClient = clientId && clientId !== 'all'
  
  // ============================================
  // STAT CARDS DATA (Totals & Growth)
  // ============================================
  
  // Total clients (exclude soft-deleted) - different logic for single client filter
  let totalClients = 0
  if (isFilteringByClient) {
    totalClients = 1 // If filtering by single client
  } else {
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
    totalClients = count || 0
  }
  
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
  
  // Journal entries count - only applies when not filtering by client
  let journalCount = 0
  if (!isFilteringByClient) {
    const { data: jCount } = await supabase.rpc('count_journal_entries')
    journalCount = jCount || 0
  }
  
  // Client growth calculation - only meaningful when not filtering
  let clientGrowth = 0
  if (!isFilteringByClient) {
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
    
    clientGrowth = clientsLastMonth && clientsLastMonth > 0
      ? Math.round(((clientsThisMonth || 0) - clientsLastMonth) / clientsLastMonth * 100)
      : 0
  }
  
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
  
  // ============================================
  // NEW METRICS - Phase 1 (15 Quick-Win Metrics)
  // ============================================
  
  // 1. Archived Clients - only when not filtering by client
  let archivedClients = 0
  if (!isFilteringByClient) {
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
    archivedClients = count || 0
  }
  
  // 2-4. Onboarding Status counts
  let onboardingNotStarted = 0
  let onboardingInProgress = 0
  let onboardingCompleted = 0
  
  if (isFilteringByClient) {
    // Get status for the specific client
    const { data: clientData } = await supabase
      .from('clients')
      .select('questionnaire_status')
      .eq('id', clientId)
      .single()
    
    if (clientData?.questionnaire_status === 'not_started') onboardingNotStarted = 1
    else if (clientData?.questionnaire_status === 'in_progress') onboardingInProgress = 1
    else if (clientData?.questionnaire_status === 'completed') onboardingCompleted = 1
  } else {
    const { count: notStarted } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('questionnaire_status', 'not_started')
    onboardingNotStarted = notStarted || 0
    
    const { count: inProgress } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('questionnaire_status', 'in_progress')
    onboardingInProgress = inProgress || 0
    
    const { count: completed } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('questionnaire_status', 'completed')
    onboardingCompleted = completed || 0
  }
  
  // 5. Onboarding Completion Rate
  const totalClientsForRate = totalClients || 0
  const completedCount = onboardingCompleted || 0
  const completionRate = totalClientsForRate > 0 
    ? Math.round((completedCount / totalClientsForRate) * 100) 
    : 0
  
  // 6. Total Projects
  const { count: totalProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clientIds)
    .is('deleted_at', null)
  
  // 7. Completed Projects
  const { count: completedProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clientIds)
    .is('deleted_at', null)
    .eq('status', 'done')
  
  // 8. Overdue Projects (due_date < now AND status != done)
  const { count: overdueProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clientIds)
    .is('deleted_at', null)
    .neq('status', 'done')
    .lt('due_date', today)
  
  // 9. Projects per Client
  const projectsPerClient = totalClientsForRate > 0 
    ? Math.round(((totalProjects || 0) / totalClientsForRate) * 10) / 10 
    : 0
  
  // 10. Content This Week
  const { count: contentThisWeek } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clientIds)
    .is('deleted_at', null)
    .gte('created_at', sevenDaysAgo)
  
  // 11. Total AI Generations (with fallback if table doesn't exist)
  let aiGenerations = 0
  try {
    if (isFilteringByClient) {
      const { count } = await supabase
        .from('ai_generations')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
      aiGenerations = count || 0
    } else {
      const { count } = await supabase
        .from('ai_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      aiGenerations = count || 0
    }
  } catch (e) {
    console.log('ai_generations table not found, defaulting to 0')
  }
  
  // 12. Total Tokens Used (with fallback if table doesn't exist)
  let totalTokens = 0
  try {
    const query = supabase
      .from('ai_executions')
      .select('tokens_used, completion_tokens')
      .eq('user_id', user.id)
    
    const { data: executions } = await query
    
    if (executions) {
      totalTokens = executions.reduce((sum, exec) => {
        return sum + (exec.tokens_used || 0) + (exec.completion_tokens || 0)
      }, 0)
    }
  } catch (e) {
    console.log('ai_executions table not found, defaulting to 0')
  }
  
  // 14. Journal Entries This Week - only when not filtering by client
  let entriesThisWeek = 0
  if (!isFilteringByClient) {
    try {
      const { data: weekCount } = await supabase.rpc('count_journal_entries_since', { 
        since_date: sevenDaysAgo 
      })
      entriesThisWeek = weekCount || 0
    } catch (e) {
      try {
        const { count } = await supabase
          .from('journal_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo)
        entriesThisWeek = count || 0
      } catch (e2) {
        console.log('journal_entries query failed, defaulting to 0')
      }
    }
  }
  
  // 15. Questionnaires Completed - same as onboardingCompleted
  const questionnairesCompleted = onboardingCompleted || 0
  
  // ============================================
  // TIME SERIES DATA
  // ============================================
  
  // CLIENT GROWTH TREND (exclude soft-deleted) - only when not filtering
  let clientTrend: Array<{ date: string; value: number }> = []
  if (!isFilteringByClient) {
    const { data: clientsData } = await supabase
      .from('clients')
      .select('created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
    
    clientTrend = processTimeSeries(clientsData || [], days, true) // cumulative
  } else {
    // For single client, show a flat line at 1
    clientTrend = generateFlatLine(days, 1)
  }
  
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
  
  // DAILY ACTIVITY TREND - only when not filtering by client
  let activityTrend: Array<{ date: string; value: number }> = []
  if (!isFilteringByClient) {
    const { data: activityData } = await supabase
      .from('activity_log')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
    
    activityTrend = processTimeSeries(activityData || [], days, false)
  } else {
    activityTrend = generateFlatLine(days, 0)
  }
  
  return NextResponse.json({
    // Stat cards data
    stats: {
      // Existing metrics
      totalClients: totalClients || 0,
      activeProjects: activeProjects || 0,
      totalContent: totalContent || 0,
      journalEntries: journalCount || 0,
      clientGrowth,
      contentByType,
      projectsByStatus,
      
      // NEW Phase 1 Metrics
      archivedClients: archivedClients || 0,
      onboardingStatus: {
        not_started: onboardingNotStarted || 0,
        in_progress: onboardingInProgress || 0,
        completed: onboardingCompleted || 0
      },
      completionRate,
      totalProjects: totalProjects || 0,
      completedProjects: completedProjects || 0,
      overdueProjects: overdueProjects || 0,
      projectsPerClient,
      contentThisWeek: contentThisWeek || 0,
      aiGenerations,
      totalTokens,
      entriesThisWeek,
      questionnairesCompleted
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

function generateFlatLine(days: number, value: number): Array<{ date: string; value: number }> {
  const result: Array<{ date: string; value: number }> = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    result.push({
      date: date.toISOString().split('T')[0],
      value
    })
  }
  
  return result
}
