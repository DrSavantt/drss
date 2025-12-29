import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  
  try {
    const { data: executions, error } = await supabase
      .from('ai_executions')
      .select(`
        id,
        task_type,
        complexity,
        input_data,
        output_data,
        input_tokens,
        output_tokens,
        total_cost_usd,
        duration_ms,
        created_at,
        client_id,
        clients (
          id,
          name
        ),
        ai_models (
          model_name,
          display_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
  
    if (error) {
      console.error('Error fetching AI history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data for easier consumption
    const transformedData = executions?.map(exec => {
      // Extract prompt from input_data
      const inputData = exec.input_data as any;
      const prompt = inputData?.messages?.[0]?.content || '';
      
      // Extract content from output_data
      const outputData = exec.output_data as any;
      const output = outputData?.content || '';

      return {
        id: exec.id,
        prompt,
        output,
        content_type: exec.task_type === 'content_generation' ? 'Generated Content' : exec.task_type,
        model_name: (exec.ai_models as any)?.display_name || 'Unknown Model',
        client_id: exec.client_id,
        client_name: (exec.clients as any)?.name || null,
        cost: exec.total_cost_usd || 0,
        tokens: (exec.input_tokens || 0) + (exec.output_tokens || 0),
        duration_ms: exec.duration_ms,
        complexity: exec.complexity,
        created_at: exec.created_at,
      };
    }) || [];
  
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

