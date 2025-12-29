import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/client-questionnaire/[clientId]/overrides
 * Get all overrides for a client
 * Used by the override editor UI to show what's been customized
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
      .select('id, name')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get all overrides for this client
    const { data: overrides, error } = await supabase
      .from('client_questionnaire_overrides')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Separate question and section overrides for easier UI handling
    const questionOverrides = overrides?.filter(o => o.question_id) || []
    const sectionOverrides = overrides?.filter(o => o.section_id) || []

    return NextResponse.json({ 
      data: overrides || [],
      questionOverrides,
      sectionOverrides,
      count: overrides?.length || 0,
      client: { id: client.id, name: client.name }
    })
  } catch (error) {
    console.error('Error fetching overrides:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overrides', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

