import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/client-questionnaire/[clientId]
 * Get merged config (global + client overrides)
 * Returns questionnaire config with client-specific customizations applied
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

    // Get global sections
    const { data: sections, error: sectionsError } = await supabase
      .from('questionnaire_sections')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })

    if (sectionsError) throw sectionsError

    // Get global questions with help
    const { data: questions, error: questionsError } = await supabase
      .from('questionnaire_questions')
      .select(`
        *,
        questionnaire_help (*)
      `)
      .eq('enabled', true)
      .order('sort_order', { ascending: true })

    if (questionsError) throw questionsError

    // Get client-specific overrides
    const { data: overrides, error: overridesError } = await supabase
      .from('client_questionnaire_overrides')
      .select('*')
      .eq('client_id', clientId)

    if (overridesError) throw overridesError

    // Create override lookup maps
    const questionOverrides = new Map()
    const sectionOverrides = new Map()
    
    overrides?.forEach(override => {
      if (override.question_id) {
        questionOverrides.set(override.question_id, override)
      } else if (override.section_id) {
        sectionOverrides.set(override.section_id, override)
      }
    })

    // Merge sections with overrides
    const mergedSections = sections?.map(section => {
      const override = sectionOverrides.get(section.id)
      return {
        ...section,
        // Apply override if exists
        enabled: override ? override.is_enabled : section.enabled,
        title: override?.custom_text || section.title,
        _hasOverride: !!override,
        _overrideId: override?.id
      }
    }).filter(s => s.enabled) // Filter out disabled sections

    // Merge questions with overrides
    const mergedQuestions = questions?.map(question => {
      const override = questionOverrides.get(question.id)
      const help = question.questionnaire_help?.[0] || null
      
      // Merge help content if override has custom_help
      const mergedHelp = override?.custom_help 
        ? { ...help, ...override.custom_help }
        : help

      return {
        ...question,
        // Apply override if exists
        enabled: override ? override.is_enabled : question.enabled,
        text: override?.custom_text || question.text,
        help: mergedHelp,
        _hasOverride: !!override,
        _overrideId: override?.id,
        _usingGlobal: !override
      }
    }).filter(q => q.enabled) // Filter out disabled questions

    // Group questions by section
    const questionsBySection = mergedQuestions?.reduce((acc, q) => {
      if (!acc[q.section_id]) acc[q.section_id] = []
      acc[q.section_id].push(q)
      return acc
    }, {} as Record<number, typeof mergedQuestions>)

    // Build final config structure
    const config = mergedSections?.map(section => ({
      ...section,
      questions: questionsBySection?.[section.id] || []
    }))

    return NextResponse.json({ 
      data: config,
      client: { id: client.id, name: client.name },
      overrideCount: overrides?.length || 0
    })
  } catch (error) {
    console.error('Error fetching client questionnaire config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch config', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

