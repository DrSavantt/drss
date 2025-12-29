import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/client-questionnaire/[clientId]/override
 * Create or update an override for a question or section
 * Allows per-client customization of questionnaire content
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
    const { 
      question_id, 
      section_id, 
      override_type, 
      is_enabled, 
      custom_text,
      custom_description, // For sections - stored in custom_help.description
      custom_help 
    } = body

    // Validate: must have either question_id or section_id
    if (!question_id && !section_id) {
      return NextResponse.json(
        { error: 'Must provide either question_id or section_id' },
        { status: 400 }
      )
    }

    if (question_id && section_id) {
      return NextResponse.json(
        { error: 'Cannot provide both question_id and section_id' },
        { status: 400 }
      )
    }

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

    // Check if override already exists
    let existingOverride = null
    
    if (question_id) {
      const { data } = await supabase
        .from('client_questionnaire_overrides')
        .select('id')
        .eq('client_id', clientId)
        .eq('question_id', question_id)
        .maybeSingle()
      existingOverride = data
    } else if (section_id) {
      const { data } = await supabase
        .from('client_questionnaire_overrides')
        .select('id')
        .eq('client_id', clientId)
        .eq('section_id', section_id)
        .eq('override_type', override_type || 'section')
        .maybeSingle()
      existingOverride = data
    }

    // For sections, store description in custom_help.description
    // For questions, use custom_help directly
    let finalCustomHelp = custom_help || null
    if (section_id && custom_description) {
      finalCustomHelp = { 
        ...(custom_help || {}), 
        description: custom_description 
      }
    }

    const overrideData = {
      client_id: clientId,
      question_id: question_id || null,
      section_id: section_id || null,
      override_type: override_type || (question_id ? 'question' : 'section'),
      is_enabled: is_enabled ?? true,
      custom_text: custom_text || null,
      custom_help: finalCustomHelp,
      updated_at: new Date().toISOString()
    }

    if (existingOverride) {
      // Update existing override
      const { data, error } = await supabase
        .from('client_questionnaire_overrides')
        .update(overrideData)
        .eq('id', existingOverride.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ 
        data, 
        action: 'updated',
        message: 'Override updated successfully'
      })
    } else {
      // Create new override
      const { data, error } = await supabase
        .from('client_questionnaire_overrides')
        .insert(overrideData)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ 
        data, 
        action: 'created',
        message: 'Override created successfully'
      })
    }
  } catch (error) {
    console.error('Error saving override:', error)
    return NextResponse.json(
      { error: 'Failed to save override', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

