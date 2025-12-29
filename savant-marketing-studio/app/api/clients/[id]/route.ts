import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    // Fetch client (exclude soft-deleted)
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Count projects (exclude soft-deleted)
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id)
      .is('deleted_at', null);

    // Count content (exclude soft-deleted)
    const { count: contentCount } = await supabase
      .from('content_assets')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id)
      .is('deleted_at', null);

    // Count AI calls and calculate spend
    const { data: aiGenerations } = await supabase
      .from('ai_generations')
      .select('cost_usd')
      .eq('client_id', id);

    const aiCalls = aiGenerations?.length || 0;
    const aiSpend = aiGenerations?.reduce((sum, gen) => sum + (gen.cost_usd || 0), 0) || 0;

    // Map status
    let status: "onboarded" | "onboarding" | "new" = "new"
    if (client.questionnaire_status === 'completed') {
      status = "onboarded"
    } else if (client.questionnaire_status === 'in_progress') {
      status = "onboarding"
    }

    // Extract brand info from responses
    const brandVoice = client.intake_responses?.brand_voice || 
                       client.brand_data?.voice || 
                       'Not yet defined';
    const targetAudience = client.intake_responses?.target_audience || 
                          client.brand_data?.target_audience || 
                          'Not yet defined';

    return NextResponse.json({
      id: client.id,
      name: client.name,
      email: client.email || '',
      website: client.website || '',
      status,
      industry: client.industry || 'Not specified',
      projectCount: projectCount || 0,
      contentCount: contentCount || 0,
      aiCalls,
      aiSpend: Math.round(aiSpend * 100) / 100,
      brandVoice,
      targetAudience,
      // Questionnaire fields
      questionnaire_status: client.questionnaire_status || null,
      questionnaire_token: client.questionnaire_token || null,
      questionnaire_completed_at: client.questionnaire_completed_at || null,
      questionnaire_progress: client.questionnaire_progress || null,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

