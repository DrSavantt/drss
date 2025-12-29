import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/questionnaire-response/[clientId]/submit
 * Finalize a draft as submitted
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
    const body = await request.json()
    const { submitted_by = 'admin' } = body // 'admin' or 'client'

    // Verify user owns this client
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get the current draft
    const { data: draft, error: fetchError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'draft')
      .eq('is_latest', true)
      .single()

    if (fetchError || !draft) {
      return NextResponse.json(
        { error: 'No draft found to submit' },
        { status: 404 }
      )
    }

    // Update draft to submitted
    const { data: response, error: updateError } = await supabase
      .from('questionnaire_responses')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submitted_by,
        updated_at: new Date().toISOString()
      })
      .eq('id', draft.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Also update the client's questionnaire status for backward compatibility
    await supabase
      .from('clients')
      .update({
        questionnaire_status: 'completed',
        questionnaire_completed_at: new Date().toISOString(),
        // Sync to intake_responses for backward compatibility with existing code
        intake_responses: draft.response_data
      })
      .eq('id', clientId)

    return NextResponse.json({ 
      data: response,
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

