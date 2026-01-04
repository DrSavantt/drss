import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeForDb, hasQuestionnaireContent } from '@/lib/utils/safe-render'

/**
 * POST /api/questionnaire-response
 * Update client's intake_responses (auto-save for admin form)
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

    if (!client_id) {
      return NextResponse.json(
        { error: 'Missing client_id' },
        { status: 400 }
      )
    }

    // SANITIZE: Skip save if response_data is empty or {}
    // This prevents auto-save from creating {} in the database
    if (!response_data || !hasQuestionnaireContent(response_data)) {
      return NextResponse.json({ 
        data: null, 
        action: 'skipped',
        reason: 'No meaningful content to save'
      })
    }

    // Sanitize the data before saving (convert {} to null in nested objects)
    const sanitizedData = sanitizeForDb(response_data)

    // Verify user owns this client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, questionnaire_status')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update client's intake_responses
    const { data, error } = await supabase
      .from('clients')
      .update({
        intake_responses: sanitizedData,
        questionnaire_status: client.questionnaire_status === 'completed' ? 'completed' : 'in_progress'
      })
      .eq('id', client_id)
      .select('id, intake_responses, questionnaire_status')
      .single()

    if (error) throw error
    
    return NextResponse.json({ 
      data, 
      action: 'updated'
    })
  } catch (error) {
    console.error('Error saving questionnaire response:', error)
    return NextResponse.json(
      { error: 'Failed to save response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

