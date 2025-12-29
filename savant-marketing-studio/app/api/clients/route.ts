import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    // Fetch all clients (exclude soft-deleted)
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each client, fetch counts
    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        // Count projects (exclude soft-deleted)
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .is('deleted_at', null);

        // Count content (exclude soft-deleted)
        const { count: contentCount } = await supabase
          .from('content_assets')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .is('deleted_at', null);

        // Calculate AI spend
        const { data: aiGenerations } = await supabase
          .from('ai_generations')
          .select('cost_usd')
          .eq('client_id', client.id);

        const aiSpend = aiGenerations?.reduce((sum, gen) => sum + (gen.cost_usd || 0), 0) || 0;

        // Map questionnaire_status to status field for v0 compatibility
        let status: "onboarded" | "onboarding" | "new" = "new"
        if (client.questionnaire_status === 'completed') {
          status = "onboarded"
        } else if (client.questionnaire_status === 'in_progress') {
          status = "onboarding"
        }

        return {
          id: client.id,
          name: client.name,
          email: client.email || '',
          status,
          projectCount: projectCount || 0,
          contentCount: contentCount || 0,
          aiSpend: Math.round(aiSpend * 100) / 100,
          industry: client.industry || 'Not specified',
        };
      })
    );

    return NextResponse.json(clientsWithStats);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
