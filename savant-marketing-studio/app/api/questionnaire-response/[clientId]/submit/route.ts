import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/questionnaire-response/[clientId]/submit
 * Mark questionnaire as completed (uses clients.intake_responses)
 */
export async function PUT(
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

    // Verify user owns this client and get current data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, intake_responses')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    if (!client.intake_responses) {
      return NextResponse.json(
        { error: 'No draft found to submit' },
        { status: 404 }
      )
    }

    // Mark as completed
    const { data, error: updateError } = await supabase
      .from('clients')
      .update({
        questionnaire_status: 'completed',
        questionnaire_completed_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select('id, questionnaire_status, questionnaire_completed_at')
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ 
      data,
      message: 'Questionnaire submitted successfully'
    })
  } catch (error) {
    console.error('Error submitting questionnaire:', error)
    return NextResponse.json(
      { error: 'Failed to submit questionnaire', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

