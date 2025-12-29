import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/questionnaire-response/[clientId]/draft
 * Delete draft responses for a client, resetting their questionnaire to not_started
 */
export async function DELETE(
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

    // Verify user owns this client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, user_id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Delete all responses from questionnaire_responses table for this client
    // (both draft and any submitted versions - full reset)
    const { error: deleteResponseError } = await supabase
      .from('questionnaire_responses')
      .delete()
      .eq('client_id', clientId)

    if (deleteResponseError) {
      console.error('Delete response error:', deleteResponseError)
      // Continue to reset client even if no responses existed
    }

    // Clear intake_responses and reset questionnaire status in clients table
    const { error: updateClientError } = await supabase
      .from('clients')
      .update({
        intake_responses: null,
        questionnaire_status: 'not_started',
        questionnaire_completed_at: null,
      })
      .eq('id', clientId)

    if (updateClientError) {
      console.error('Update client error:', updateClientError)
      return NextResponse.json({ error: 'Failed to reset client questionnaire status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Draft deleted and questionnaire reset to not started' 
    })
  } catch (error) {
    console.error('Error deleting draft:', error)
    return NextResponse.json(
      { error: 'Failed to delete draft', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

