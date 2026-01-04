import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/questionnaire-response/[clientId]
 * Get questionnaire response for a client (from clients.intake_responses)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Get client with intake_responses
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, intake_responses, questionnaire_status, questionnaire_completed_at, updated_at')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Parse intake_responses
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
      data: {
        id: client.id,
        response_data: responseData,
        status: client.questionnaire_status === 'completed' ? 'submitted' : 
                client.questionnaire_status === 'in_progress' ? 'draft' : null,
        submitted_at: client.questionnaire_completed_at,
        updated_at: client.updated_at
      },
      has_response: !!responseData
    })
  } catch (error) {
    console.error('Error fetching questionnaire responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

