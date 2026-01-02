import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    // OPTIMIZED: Single query with nested relations instead of N+1 queries
    // Previously: 1 + (N * 3) queries for N clients = 31 queries for 10 clients
    // Now: 1 query total - fetch clients with related data and count client-side
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        projects(id, deleted_at),
        content_assets(id, deleted_at),
        ai_generations(cost_estimate)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the response to flatten counts
    const clientsWithStats = (clients || []).map(client => {
      // Count projects (exclude soft-deleted)
      const projectCount = Array.isArray(client.projects) 
        ? client.projects.filter((p: any) => !p.deleted_at).length 
        : 0;
      
      // Count content (exclude soft-deleted)
      const contentCount = Array.isArray(client.content_assets) 
        ? client.content_assets.filter((c: any) => !c.deleted_at).length 
        : 0;
      
      // Calculate AI spend from ai_generations array
      const aiSpend = Array.isArray(client.ai_generations)
        ? client.ai_generations.reduce(
            (sum: number, gen: { cost_estimate: number | null }) => sum + (gen.cost_estimate || 0),
            0
          )
        : 0;
      
      // Map questionnaire_status to status field for v0 compatibility
      let status: "onboarded" | "onboarding" | "new" = "new";
      if (client.questionnaire_status === 'completed') {
        status = "onboarded";
      } else if (client.questionnaire_status === 'in_progress') {
        status = "onboarding";
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
      };
    });

    const response = NextResponse.json(clientsWithStats);
    
    // Cache for 30 seconds, allow stale-while-revalidate for 60 seconds
    // This reduces database load for rapid page refreshes
    response.headers.set(
      'Cache-Control',
      'private, s-maxage=30, stale-while-revalidate=60'
    );
    
    return response;
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
