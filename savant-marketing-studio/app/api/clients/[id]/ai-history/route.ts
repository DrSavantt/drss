import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not configured' },
      { status: 500 }
    );
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    // Fetch AI executions for this client
    const { data: executions, error } = await supabase
      .from('ai_executions')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching AI executions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch AI history' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalTokens = executions?.reduce(
      (sum, e) => sum + (e.input_tokens || 0) + (e.output_tokens || 0),
      0
    ) || 0;

    const totalSpend = executions?.reduce(
      (sum, e) => sum + Number(e.total_cost_usd || 0),
      0
    ) || 0;

    // Get total count (for pagination)
    const { count } = await supabase
      .from('ai_executions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .eq('status', 'success');

    return NextResponse.json({
      executions: executions || [],
      totalExecutions: count || 0,
      totalTokens,
      totalSpend: Math.round(totalSpend * 1000000) / 1000000, // Round to 6 decimals
    });
  } catch (error) {
    console.error('Error in AI history route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

