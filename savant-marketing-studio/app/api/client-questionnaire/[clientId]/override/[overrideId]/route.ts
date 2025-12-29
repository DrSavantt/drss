import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/client-questionnaire/[clientId]/override/[overrideId]
 * Delete an override (reset question/section to global config)
 * Removes client-specific customization, reverting to default
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; overrideId: string }> }
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

    const { clientId, overrideId } = await params

    // Verify user owns this client
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify override exists and belongs to this client
    const { data: override } = await supabase
      .from('client_questionnaire_overrides')
      .select('id, question_id, section_id')
      .eq('id', overrideId)
      .eq('client_id', clientId)
      .single()

    if (!override) {
      return NextResponse.json(
        { error: 'Override not found' },
        { status: 404 }
      )
    }

    // Delete the override
    const { error } = await supabase
      .from('client_questionnaire_overrides')
      .delete()
      .eq('id', overrideId)
      .eq('client_id', clientId) // Extra safety check

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Override deleted, using global config',
      deleted: {
        id: override.id,
        question_id: override.question_id,
        section_id: override.section_id
      }
    })
  } catch (error) {
    console.error('Error deleting override:', error)
    return NextResponse.json(
      { error: 'Failed to delete override', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

