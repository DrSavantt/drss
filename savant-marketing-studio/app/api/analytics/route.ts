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
  
  // Get user's clients for filtering
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { data: userClients } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
  
  const clientIds = userClients?.map(c => c.id) || []
  
  // CLIENT GROWTH TREND
  const { data: clientsData } = await supabase
    .from('clients')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })
  
  const clientTrend = processTimeSeries(clientsData || [], days, true) // cumulative
  
  // PROJECTS COMPLETED TREND
  const { data: projectsData } = await supabase
    .from('projects')
    .select('updated_at, status')
    .in('client_id', clientIds)
    .eq('status', 'done')
    .gte('updated_at', startDate.toISOString())
    .order('updated_at', { ascending: true })
  
  const projectsTrend = processTimeSeries(projectsData || [], days, false)
  
  // CONTENT CREATED TREND
  const { data: contentData } = await supabase
    .from('content_assets')
    .select('created_at')
    .in('client_id', clientIds)
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
