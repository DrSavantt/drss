import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/questionnaire-response/[clientId]/latest
 * Get the latest response (draft or submitted)
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

    // Get latest response (is_latest = true)
    const { data: response, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_latest', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return NextResponse.json({ 
      data: response || null,
      has_response: !!response
    })
  } catch (error) {
    console.error('Error fetching latest response:', error)
    return NextResponse.json(
      { error: 'Failed to fetch response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

