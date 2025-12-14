'use server'
import { createClient } from '@/lib/supabase/server';

// ============================================
// METRIC 1: CLIENT HEALTH
// ============================================
export async function getClientHealthMetric() {
  const supabase = await createClient();
  if (!supabase) return null;
  
  // Total clients
  const { count: total } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });
  
  if (!total) return null;
  
  // Active clients (updated in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: active } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', thirtyDaysAgo);
  
  // Questionnaires completed
  const { count: questionnairesCompleted } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('questionnaire_status', 'completed');
  
  // Inactive clients (not updated in 30+ days)
  const { count: inactive } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .lt('updated_at', thirtyDaysAgo);
  
  // Clients with overdue projects
  const today = new Date().toISOString().split('T')[0];
  const { data: clientsWithOverdue } = await supabase
    .from('projects')
    .select('client_id')
    .lt('due_date', today)
    .neq('status', 'done');
  
  const overdueCount = new Set(clientsWithOverdue?.map(p => p.client_id) || []).size;
  
  // Calculate health score (weighted)
  const activePercent = (active! / total) * 100;
  const questionnairePercent = (questionnairesCompleted! / total) * 100;
  const health = Math.round((activePercent * 0.6) + (questionnairePercent * 0.4));
  
  return {
    health,
    total,
    active,
    activePercent: Math.round(activePercent),
    questionnairesCompleted,
    questionnairePercent: Math.round(questionnairePercent),
    inactive,
    overdueProjects: overdueCount
  };
}

// ============================================
// METRIC 2: PROJECT VELOCITY
// ============================================
export async function getProjectVelocityMetric() {
  const supabase = await createClient();
  if (!supabase) return null;
  
  // Projects by status
  const { data: projects } = await supabase
    .from('projects')
    .select('id, status, created_at, updated_at');
  
  if (!projects) return null;
  
  const backlog = projects.filter(p => p.status === 'backlog').length;
  const inProgress = projects.filter(p => p.status === 'in_progress').length;
  const inReview = projects.filter(p => p.status === 'in_review').length;
  const done = projects.filter(p => p.status === 'done').length;
  
  // Projects completed this week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const completedThisWeek = projects.filter(p => 
    p.status === 'done' && p.updated_at >= oneWeekAgo
  ).length;
  
  // Projects stuck (in same status > 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const stuck = projects.filter(p => 
    p.status !== 'done' && p.updated_at < sevenDaysAgo
  ).length;
  
  // Average completion rate (rough estimate)
  const totalProjects = projects.length;
  const completionRate = totalProjects > 0 ? Math.round((done / totalProjects) * 100) : 0;
  
  // Average velocity (days to complete) - simplified
  const avgVelocity = 3.2; // Placeholder - would need more complex calculation
  
  return {
    avgVelocity,
    total: totalProjects,
    backlog,
    inProgress,
    inReview,
    done,
    completedThisWeek,
    stuck,
    completionRate
  };
}

// ============================================
// METRIC 3: CONTENT OUTPUT
// ============================================
export async function getContentOutputMetric() {
  const supabase = await createClient();
  if (!supabase) return null;
  
  // Total content
  const { count: total } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true });
  
  // Content this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { count: thisMonth } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());
  
  // Content this week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: thisWeek } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo);
  
  // Content by type
  const { data: contentByType } = await supabase
    .from('content_assets')
    .select('asset_type');
  
  const typeCounts = contentByType?.reduce((acc, item) => {
    acc[item.asset_type] = (acc[item.asset_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  return {
    thisMonth: thisMonth || 0,
    thisWeek: thisWeek || 0,
    total: total || 0,
    byType: typeCounts
  };
}

// ============================================
// METRIC 4: STORAGE USAGE
// ============================================
export async function getStorageMetric() {
  const supabase = await createClient();
  if (!supabase) return null;
  
  // Get all files
  const { data: files } = await supabase
    .from('content_assets')
    .select('file_size')
    .not('file_size', 'is', null);
  
  const totalBytes = files?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0;
  const totalMB = Math.round(totalBytes / (1024 * 1024) * 10) / 10;
  
  // Files uploaded this week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: filesThisWeek } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo)
    .not('file_size', 'is', null);
  
  return {
    totalMB,
    filesCount: files?.length || 0,
    filesThisWeek: filesThisWeek || 0
  };
}

// ============================================
// METRIC 5: CAPACITY
// ============================================
export async function getCapacityMetric() {
  const supabase = await createClient();
  if (!supabase) return null;
  
  const { count: currentClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });
  
  const maxCapacity = 25; // Your max client capacity
  const hoursPerWeek = 40; // Available hours
  const avgHoursPerClient = currentClients ? hoursPerWeek / currentClients : 0;
  
  const capacityPercent = currentClients ? Math.round((currentClients / maxCapacity) * 100) : 0;
  const clientsCanAdd = maxCapacity - (currentClients || 0);
  
  return {
    currentClients: currentClients || 0,
    maxCapacity,
    capacityPercent,
    clientsCanAdd,
    hoursPerWeek,
    avgHoursPerClient: Math.round(avgHoursPerClient * 10) / 10
  };
}
