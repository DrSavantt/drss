import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  // ============================================
  // METRIC 1: CLIENT HEALTH
  // ============================================
  let clientHealth = null;
  
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });

  if (totalClients && totalClients > 0) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { count: active } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo);

    const { count: questionnairesCompleted } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('questionnaire_status', 'completed');

    const { count: inactive } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .lt('updated_at', thirtyDaysAgo);

    const today = new Date().toISOString().split('T')[0];
    const { data: clientsWithOverdue } = await supabase
      .from('projects')
      .select('client_id')
      .lt('due_date', today)
      .neq('status', 'done');

    const overdueCount = new Set(clientsWithOverdue?.map(p => p.client_id) || []).size;

    const activePercent = ((active || 0) / totalClients) * 100;
    const questionnairePercent = ((questionnairesCompleted || 0) / totalClients) * 100;
    const health = Math.round((activePercent * 0.6) + (questionnairePercent * 0.4));

    clientHealth = {
      health,
      total: totalClients,
      active: active || 0,
      activePercent: Math.round(activePercent),
      questionnairesCompleted: questionnairesCompleted || 0,
      questionnairePercent: Math.round(questionnairePercent),
      inactive: inactive || 0,
      overdueProjects: overdueCount
    };
  }

  // ============================================
  // METRIC 2: PROJECT VELOCITY
  // ============================================
  let projectVelocity = null;

  const { data: projects } = await supabase
    .from('projects')
    .select('id, status, created_at, updated_at');

  if (projects) {
    const backlog = projects.filter(p => p.status === 'backlog').length;
    const inProgress = projects.filter(p => p.status === 'in_progress').length;
    const inReview = projects.filter(p => p.status === 'in_review').length;
    const done = projects.filter(p => p.status === 'done').length;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const completedThisWeek = projects.filter(p => 
      p.status === 'done' && p.updated_at >= oneWeekAgo
    ).length;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const stuck = projects.filter(p => 
      p.status !== 'done' && p.updated_at < sevenDaysAgo
    ).length;

    const totalProjects = projects.length;
    const completionRate = totalProjects > 0 ? Math.round((done / totalProjects) * 100) : 0;
    const avgVelocity = 3.2; // Placeholder

    projectVelocity = {
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
  const { count: totalContent } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: thisMonth } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: thisWeek } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo);

  const { data: contentByType } = await supabase
    .from('content_assets')
    .select('asset_type');

  const typeCounts = contentByType?.reduce((acc, item) => {
    acc[item.asset_type] = (acc[item.asset_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const contentOutput = {
    thisMonth: thisMonth || 0,
    thisWeek: thisWeek || 0,
    total: totalContent || 0,
    byType: typeCounts
  };

  // ============================================
  // METRIC 4: STORAGE USAGE
  // ============================================
  const { data: files } = await supabase
    .from('content_assets')
    .select('file_size')
    .not('file_size', 'is', null);

  const totalBytes = files?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0;
  const totalMB = Math.round(totalBytes / (1024 * 1024) * 10) / 10;

  const { count: filesThisWeek } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo)
    .not('file_size', 'is', null);

  const storage = {
    totalMB,
    filesCount: files?.length || 0,
    filesThisWeek: filesThisWeek || 0
  };

  // ============================================
  // METRIC 5: CAPACITY
  // ============================================
  const maxCapacity = 25;
  const hoursPerWeek = 40;
  const currentClients = totalClients || 0;
  const avgHoursPerClient = currentClients ? hoursPerWeek / currentClients : 0;
  const capacityPercent = currentClients ? Math.round((currentClients / maxCapacity) * 100) : 0;
  const clientsCanAdd = maxCapacity - currentClients;

  const capacity = {
    currentClients,
    maxCapacity,
    capacityPercent,
    clientsCanAdd,
    hoursPerWeek,
    avgHoursPerClient: Math.round(avgHoursPerClient * 10) / 10
  };

  return NextResponse.json({
    clientHealth,
    projectVelocity,
    contentOutput,
    storage,
    capacity
  });
}
