// Server Component - fetches all analytics data at once
import { createClient } from '@/lib/supabase/server'
import { AnalyticsPageContent } from '@/components/analytics/analytics-page-content'

export const dynamic = 'force-dynamic'

// Helper to process time series data
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

export default async function AnalyticsPage() {
  const supabase = await createClient()
  
  if (!supabase) {
    return <AnalyticsPageContent initialData={null} initialClients={[]} />
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <AnalyticsPageContent initialData={null} initialClients={[]} />
  }

  const days = 30 // Default to 30 days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const today = new Date().toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  // Fetch all user's clients
  const { data: userClients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .is('deleted_at', null)
  
  const clientIds = userClients?.map(c => c.id) || []

  // Fetch all stats in parallel
  const [
    { count: totalClients },
    { count: activeProjects },
    { count: totalContent },
    { count: totalProjects },
    { count: completedProjects },
    { count: overdueProjects },
    { count: contentThisWeek },
    { count: archivedClients },
    { count: onboardingNotStarted },
    { count: onboardingInProgress },
    { count: onboardingCompleted },
    { count: clientsThisMonth },
    { count: clientsLastMonth },
    { data: contentAssets },
    { data: projects },
    { data: clientsData },
    { data: projectsData },
    { data: contentData },
    { data: activityData },
    { data: aiExecutions }
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
    supabase.from('projects').select('*', { count: 'exact', head: true }).in('client_id', clientIds).is('deleted_at', null).neq('status', 'done'),
    supabase.from('content_assets').select('*', { count: 'exact', head: true }).in('client_id', clientIds).is('deleted_at', null),
    supabase.from('projects').select('*', { count: 'exact', head: true }).in('client_id', clientIds).is('deleted_at', null),
    supabase.from('projects').select('*', { count: 'exact', head: true }).in('client_id', clientIds).is('deleted_at', null).eq('status', 'done'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).in('client_id', clientIds).is('deleted_at', null).neq('status', 'done').lt('due_date', today),
    supabase.from('content_assets').select('*', { count: 'exact', head: true }).in('client_id', clientIds).is('deleted_at', null).gte('created_at', sevenDaysAgo),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).not('deleted_at', 'is', null),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null).eq('questionnaire_status', 'not_started'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null).eq('questionnaire_status', 'in_progress'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null).eq('questionnaire_status', 'completed'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null).gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null).gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('content_assets').select('asset_type').in('client_id', clientIds).is('deleted_at', null),
    supabase.from('projects').select('status').in('client_id', clientIds).is('deleted_at', null),
    supabase.from('clients').select('created_at').eq('user_id', user.id).is('deleted_at', null).gte('created_at', startDate.toISOString()).order('created_at', { ascending: true }),
    supabase.from('projects').select('updated_at, status').in('client_id', clientIds).is('deleted_at', null).eq('status', 'done').gte('updated_at', startDate.toISOString()).order('updated_at', { ascending: true }),
    supabase.from('content_assets').select('created_at').in('client_id', clientIds).is('deleted_at', null).gte('created_at', startDate.toISOString()).order('created_at', { ascending: true }),
    supabase.from('activity_log').select('created_at').eq('user_id', user.id).gte('created_at', startDate.toISOString()).order('created_at', { ascending: true }),
    supabase.from('ai_executions').select('model_id, input_tokens, output_tokens, total_cost_usd, client_id, created_at, task_type').eq('user_id', user.id).eq('status', 'success').gte('created_at', startDate.toISOString())
  ])

  // Calculate content by type
  const contentByType: Record<string, number> = {}
  contentAssets?.forEach(item => {
    const type = item.asset_type || 'other'
    contentByType[type] = (contentByType[type] || 0) + 1
  })

  // Calculate projects by status
  const projectsByStatus: Record<string, number> = {}
  projects?.forEach(item => {
    const status = item.status || 'unknown'
    projectsByStatus[status] = (projectsByStatus[status] || 0) + 1
  })

  // Calculate client growth
  const clientGrowth = clientsLastMonth && clientsLastMonth > 0
    ? Math.round(((clientsThisMonth || 0) - clientsLastMonth) / clientsLastMonth * 100)
    : 0

  // Calculate completion rate
  const completionRate = (totalClients || 0) > 0 
    ? Math.round(((onboardingCompleted || 0) / (totalClients || 1)) * 100) 
    : 0

  // Calculate projects per client
  const projectsPerClient = (totalClients || 0) > 0 
    ? Math.round(((totalProjects || 0) / (totalClients || 1)) * 10) / 10 
    : 0

  // Process AI data
  let aiGenerations = 0
  let totalTokens = 0
  let totalAICost = 0
  let aiByModel: Record<string, { count: number; cost: number; tokens: number }> = {}
  let aiByClient: Record<string, { count: number; cost: number; tokens: number; clientName: string }> = {}
  let aiTrend: Array<{ date: string; value: number }> = []

  if (aiExecutions && aiExecutions.length > 0) {
    aiGenerations = aiExecutions.length
    
    aiExecutions.forEach(exec => {
      const tokens = (exec.input_tokens || 0) + (exec.output_tokens || 0)
      const cost = exec.total_cost_usd || 0
      const modelId = exec.model_id || 'unknown'
      
      totalTokens += tokens
      totalAICost += cost
      
      if (!aiByModel[modelId]) {
        aiByModel[modelId] = { count: 0, cost: 0, tokens: 0 }
      }
      aiByModel[modelId].count++
      aiByModel[modelId].cost += cost
      aiByModel[modelId].tokens += tokens
      
      if (exec.client_id) {
        if (!aiByClient[exec.client_id]) {
          aiByClient[exec.client_id] = { count: 0, cost: 0, tokens: 0, clientName: '' }
        }
        aiByClient[exec.client_id].count++
        aiByClient[exec.client_id].cost += cost
        aiByClient[exec.client_id].tokens += tokens
      }
    })
    
    aiTrend = processTimeSeries(aiExecutions, days, false)
    
    // Get client names for aiByClient
    if (Object.keys(aiByClient).length > 0) {
      const { data: clientNamesData } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', Object.keys(aiByClient))
      
      clientNamesData?.forEach(client => {
        if (aiByClient[client.id]) {
          aiByClient[client.id].clientName = client.name
        }
      })
    }
  } else {
    aiTrend = generateFlatLine(days, 0)
  }

  // Get journal entries count
  let journalCount = 0
  let entriesThisWeek = 0
  try {
    const { count: jCount } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
    journalCount = jCount || 0

    const { count: weekCount } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .gte('created_at', sevenDaysAgo)
    entriesThisWeek = weekCount || 0
  } catch (error) {
    // Journal queries failed, use defaults
  }

  // Process time series data
  const clientTrend = processTimeSeries(clientsData || [], days, true)
  const projectsTrend = processTimeSeries(projectsData || [], days, false)
  const contentTrend = processTimeSeries(contentData || [], days, false)
  const activityTrend = processTimeSeries(activityData || [], days, false)

  // Build analytics data object
  const analyticsData = {
    stats: {
      totalClients: totalClients || 0,
      activeProjects: activeProjects || 0,
      totalContent: totalContent || 0,
      journalEntries: journalCount,
      clientGrowth,
      contentByType,
      projectsByStatus,
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
      questionnairesCompleted: onboardingCompleted || 0,
      totalAICost: Math.round(totalAICost * 100) / 100,
      avgCostPerGeneration: aiGenerations > 0 
        ? Math.round((totalAICost / aiGenerations) * 10000) / 10000 
        : 0,
    },
    clientGrowth: clientTrend,
    projectsCompleted: projectsTrend,
    contentCreated: contentTrend,
    dailyActivity: activityTrend,
    aiUsageTrend: aiTrend,
    aiByModel,
    aiByClient
  }

  return (
    <AnalyticsPageContent 
      initialData={analyticsData}
      initialClients={userClients || []}
    />
  )
}
