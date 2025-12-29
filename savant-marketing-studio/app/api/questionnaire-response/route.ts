import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/questionnaire-response
 * Create or update a draft response (for auto-save)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { client_id, response_data } = body

    if (!client_id || !response_data) {
      return NextResponse.json(
        { error: 'Missing client_id or response_data' },
        { status: 400 }
      )
    }

    // Verify user owns this client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if draft exists for this client
    const { data: existingDraft } = await supabase
      .from('questionnaire_responses')
      .select('id, version')
      .eq('client_id', client_id)
      .eq('status', 'draft')
      .eq('is_latest', true)
      .single()

    if (existingDraft) {
      // Update existing draft
      const { data, error } = await supabase
        .from('questionnaire_responses')
        .update({
          response_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ data, action: 'updated' })
    } else {
      // Get next version number
      const { data: versionData } = await supabase
        .rpc('get_next_response_version', { p_client_id: client_id })

      const nextVersion = versionData || 1

      // Create new draft
      const { data, error } = await supabase
        .from('questionnaire_responses')
        .insert({
          client_id,
          user_id: user.id,
          version: nextVersion,
          response_data,
          status: 'draft',
          is_latest: true
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ data, action: 'created' })
    }
  } catch (error) {
    console.error('Error saving questionnaire response:', error)
    return NextResponse.json(
      { error: 'Failed to save response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

