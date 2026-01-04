import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/public-questionnaire/latest?token=xxx
 * Get the latest response for a public form (no auth required, token-based)
 * Reads from clients.intake_responses
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

    // Get client by token with intake_responses
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, questionnaire_status, intake_responses, updated_at')
      .eq('questionnaire_token', token)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }

    // Parse intake_responses - could be wrapped { sections: {...} } or raw format
    let responseData = null;
    if (client.intake_responses) {
      const intakeData = client.intake_responses as Record<string, unknown>;
      if (intakeData.sections) {
        responseData = intakeData.sections;
      } else if (intakeData.avatar_definition || intakeData.dream_outcome) {
        responseData = intakeData;
      }
    }

    return NextResponse.json({
      response_data: responseData,
      status: client.questionnaire_status === 'completed' ? 'submitted' : 
              client.questionnaire_status === 'in_progress' ? 'draft' : null,
      updated_at: client.updated_at || null,
      has_response: !!responseData,
    });
  } catch (error) {
    console.error('Error fetching public questionnaire response:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    );
  }
}

