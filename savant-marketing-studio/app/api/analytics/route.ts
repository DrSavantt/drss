import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const daysParam = searchParams.get('days')
  const days = daysParam ? parseInt(daysParam) : null // null = all time
  const clientId = searchParams.get('clientId') // 'all' or UUID
  
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
  
  // For date filtering - null days means all time (no filter)
  const startDate = days ? new Date() : null
  if (startDate && days) {
    startDate.setDate(startDate.getDate() - days)
  }
  
  // For "all time", use 365 days as the display window for charts
  const chartDays = days || 365
  
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
  
  // ============================================
  // AI METRICS (Real Data from ai_executions)
  // ============================================
  
  let aiGenerations = 0
  let totalTokens = 0
  let totalAICost = 0
  let aiByModel: Record<string, { count: number; cost: number; tokens: number; modelName: string }> = {}
  let aiByClient: Record<string, { count: number; cost: number; tokens: number; clientName: string }> = {}
  let aiTrend: Array<{ date: string; value: number }> = []
  
  try {
    // Fetch AI executions
    let aiQuery = supabase
      .from('ai_executions')
      .select('model_id, input_tokens, output_tokens, total_cost_usd, client_id, created_at, task_type')
      .eq('user_id', user.id)
      .eq('status', 'success')
    
    if (startDate) {
      aiQuery = aiQuery.gte('created_at', startDate.toISOString())
    }
    
    if (isFilteringByClient) {
      aiQuery = aiQuery.eq('client_id', clientId)
    }
    
    const { data: aiExecutions } = await aiQuery
    
    if (aiExecutions && aiExecutions.length > 0) {
      aiGenerations = aiExecutions.length
      
      // Calculate totals and breakdowns
      aiExecutions.forEach(exec => {
        const tokens = (exec.input_tokens || 0) + (exec.output_tokens || 0)
        const cost = exec.total_cost_usd || 0
        const modelId = exec.model_id || 'unknown'
        
        totalTokens += tokens
        totalAICost += cost
        
        // By model breakdown
        if (!aiByModel[modelId]) {
          aiByModel[modelId] = { count: 0, cost: 0, tokens: 0, modelName: '' }
        }
        aiByModel[modelId].count++
        aiByModel[modelId].cost += cost
        aiByModel[modelId].tokens += tokens
        
        // By client breakdown (if client_id exists)
        if (exec.client_id) {
          if (!aiByClient[exec.client_id]) {
            aiByClient[exec.client_id] = { count: 0, cost: 0, tokens: 0, clientName: '' }
          }
          aiByClient[exec.client_id].count++
          aiByClient[exec.client_id].cost += cost
          aiByClient[exec.client_id].tokens += tokens
        }
      })
      
      // AI Usage Trend (daily generations) - use chartDays for display
      aiTrend = processTimeSeries(aiExecutions, chartDays, false)
      
      // Get model display names for aiByModel
      const modelIds = Object.keys(aiByModel).filter(id => id !== 'unknown')
      if (modelIds.length > 0) {
        const { data: modelsData } = await supabase
          .from('ai_models')
          .select('id, display_name')
          .in('id', modelIds)
        
        modelsData?.forEach(model => {
          if (aiByModel[model.id]) {
            aiByModel[model.id].modelName = model.display_name
          }
        })
      }
      
      // Get client names for aiByClient
      if (Object.keys(aiByClient).length > 0) {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', Object.keys(aiByClient))
        
        clientsData?.forEach(client => {
          if (aiByClient[client.id]) {
            aiByClient[client.id].clientName = client.name
          }
        })
      }
    } else {
      // No AI executions, generate empty trend
      aiTrend = generateFlatLine(chartDays, 0)
    }
  } catch {
    // AI metrics unavailable - use empty trend
    aiTrend = generateFlatLine(chartDays, 0)
  }
  
  // ============================================
  // AI USAGE BY PROJECT
  // ============================================
  
  let aiUsageByProject: Array<{
    projectId: string
    projectName: string
    totalCost: number
    totalTokens: number
    count: number
  }> = []
  
  try {
    // Fetch AI executions with project info
    let projectAiQuery = supabase
      .from('ai_executions')
      .select('project_id, total_cost_usd, input_tokens, output_tokens')
      .eq('user_id', user.id)
      .eq('status', 'success')
      .not('project_id', 'is', null)
    
    if (startDate) {
      projectAiQuery = projectAiQuery.gte('created_at', startDate.toISOString())
    }
    
    if (isFilteringByClient) {
      projectAiQuery = projectAiQuery.eq('client_id', clientId)
    }
    
    const { data: aiByProjectData } = await projectAiQuery
    
    if (aiByProjectData && aiByProjectData.length > 0) {
      // Aggregate by project
      const projectUsageMap = new Map<string, { 
        projectId: string
        projectName: string
        totalCost: number
        totalTokens: number
        count: number 
      }>()
      
      aiByProjectData.forEach(exec => {
        const projectId = exec.project_id!
        
        if (!projectUsageMap.has(projectId)) {
          projectUsageMap.set(projectId, {
            projectId,
            projectName: '', // Will be filled later
            totalCost: 0,
            totalTokens: 0,
            count: 0
          })
        }
        
        const entry = projectUsageMap.get(projectId)!
        entry.totalCost += exec.total_cost_usd || 0
        entry.totalTokens += (exec.input_tokens || 0) + (exec.output_tokens || 0)
        entry.count += 1
      })
      
      // Get project names
      const projectIds = Array.from(projectUsageMap.keys())
      if (projectIds.length > 0) {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds)
        
        projectsData?.forEach(project => {
          const entry = projectUsageMap.get(project.id)
          if (entry) {
            entry.projectName = project.name
          }
        })
      }
      
      // Convert to array, sort by cost, take top 10
      aiUsageByProject = Array.from(projectUsageMap.values())
        .map(entry => ({
          ...entry,
          projectName: entry.projectName || 'Unknown Project'
        }))
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 10)
    }
  } catch {
    // AI by project unavailable
  }
  
  // ============================================
  // AI LINKED VS UNLINKED USAGE
  // ============================================
  const aiLinkedVsUnlinked = {
    linked: { count: 0, cost: 0, tokens: 0 },
    unlinked: { count: 0, cost: 0, tokens: 0 }
  }
  
  try {
    let linkedQuery = supabase
      .from('ai_executions')
      .select('client_id, total_cost_usd, input_tokens, output_tokens')
      .eq('user_id', user.id)
      .eq('status', 'success')
    
    if (startDate) {
      linkedQuery = linkedQuery.gte('created_at', startDate.toISOString())
    }
    
    const { data: linkedData } = await linkedQuery
    
    linkedData?.forEach(exec => {
      const category = exec.client_id ? 'linked' : 'unlinked'
      aiLinkedVsUnlinked[category].count += 1
      aiLinkedVsUnlinked[category].cost += exec.total_cost_usd || 0
      aiLinkedVsUnlinked[category].tokens += (exec.input_tokens || 0) + (exec.output_tokens || 0)
    })
  } catch {
    // Linked vs unlinked unavailable
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
      } catch {
        // journal_entries query failed, defaulting to 0
      }
    }
  }
  
  // 15. Questionnaires Completed - same as onboardingCompleted
  const questionnairesCompleted = onboardingCompleted || 0

  // 16. AI Chats (active AI conversations)
  let aiChatsCount = 0
  try {
    const { count } = await supabase
      .from('ai_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')
    aiChatsCount = count || 0
  } catch {
    // ai_conversations query failed, use default
  }

  // 17. Activity by Type breakdown
  let activityByType: Record<string, number> = {}
  if (!isFilteringByClient) {
    try {
      let activityQuery = supabase
        .from('activity_log')
        .select('activity_type')
        .eq('user_id', user.id)
      
      if (startDate) {
        activityQuery = activityQuery.gte('created_at', startDate.toISOString())
      }
      
      const { data: activityTypes } = await activityQuery
      
      if (activityTypes) {
        activityTypes.forEach(item => {
          const type = item.activity_type || 'other'
          activityByType[type] = (activityByType[type] || 0) + 1
        })
      }
    } catch {
      // activity_log query failed, use empty object
    }
  }
  
  // ============================================
  // TIME SERIES DATA
  // ============================================
  
  // CLIENT GROWTH TREND (exclude soft-deleted) - only when not filtering
  let clientTrend: Array<{ date: string; value: number }> = []
  if (!isFilteringByClient) {
    let clientQuery = supabase
      .from('clients')
      .select('created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
    
    if (startDate) {
      clientQuery = clientQuery.gte('created_at', startDate.toISOString())
    }
    
    const { data: clientsData } = await clientQuery
    
    clientTrend = processTimeSeries(clientsData || [], chartDays, true) // cumulative
  } else {
    // For single client, show a flat line at 1
    clientTrend = generateFlatLine(chartDays, 1)
  }
  
  // PROJECTS COMPLETED TREND (exclude soft-deleted)
  let projectsQuery = supabase
    .from('projects')
    .select('updated_at, status')
    .in('client_id', clientIds)
    .is('deleted_at', null)
    .eq('status', 'done')
    .order('updated_at', { ascending: true })
  
  if (startDate) {
    projectsQuery = projectsQuery.gte('updated_at', startDate.toISOString())
  }
  
  const { data: projectsData } = await projectsQuery
  
  const projectsTrend = processTimeSeries(projectsData || [], chartDays, false)
  
  // CONTENT CREATED TREND (exclude soft-deleted)
  let contentQuery = supabase
    .from('content_assets')
    .select('created_at')
    .in('client_id', clientIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  
  if (startDate) {
    contentQuery = contentQuery.gte('created_at', startDate.toISOString())
  }
  
  const { data: contentData } = await contentQuery
  
  const contentTrend = processTimeSeries(contentData || [], chartDays, false)
  
  // DAILY ACTIVITY TREND - only when not filtering by client
  let activityTrend: Array<{ date: string; value: number }> = []
  if (!isFilteringByClient) {
    let activityLogQuery = supabase
      .from('activity_log')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    
    if (startDate) {
      activityLogQuery = activityLogQuery.gte('created_at', startDate.toISOString())
    }
    
    const { data: activityData } = await activityLogQuery
    
    activityTrend = processTimeSeries(activityData || [], chartDays, false)
  } else {
    activityTrend = generateFlatLine(chartDays, 0)
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
      questionnairesCompleted,
      
      // AI-specific metrics
      totalAICost: Math.round(totalAICost * 100) / 100,
      avgCostPerGeneration: aiGenerations > 0 
        ? Math.round((totalAICost / aiGenerations) * 10000) / 10000 
        : 0,
      
      // Activity metrics
      aiChats: aiChatsCount,
      activityByType,
    },
    // Time series charts
    clientGrowth: clientTrend,
    projectsCompleted: projectsTrend,
    contentCreated: contentTrend,
    dailyActivity: activityTrend,
    aiUsageTrend: aiTrend,
    
    // AI breakdowns
    aiByModel,
    aiByClient,
    aiUsageByProject,
    aiLinkedVsUnlinked
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
