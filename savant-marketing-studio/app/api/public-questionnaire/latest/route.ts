import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/public-questionnaire/latest?token=xxx
 * Get the latest response for a public form (no auth required, token-based)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get client by token
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, questionnaire_status')
      .eq('questionnaire_token', token)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }

    // Get latest response (draft or submitted)
    const { data: response, error } = await supabase
      .from('questionnaire_responses')
      .select('id, response_data, status, updated_at')
      .eq('client_id', client.id)
      .eq('is_latest', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return NextResponse.json({
      response_data: response?.response_data || null,
      status: response?.status || null,
      updated_at: response?.updated_at || null,
      has_response: !!response,
    });
  } catch (error) {
    console.error('Error fetching public questionnaire response:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    );
  }
}

