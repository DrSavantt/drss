import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/questionnaire-response/[clientId]
 * Get all response versions for a client
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

    // Get all responses for this client, ordered by version desc
    const { data: responses, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('client_id', clientId)
      .order('version', { ascending: false })

    if (error) throw error

    return NextResponse.json({ 
      data: responses,
      count: responses?.length || 0
    })
  } catch (error) {
    console.error('Error fetching questionnaire responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

