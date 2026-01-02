import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/questionnaire-config
// Returns all questionnaire sections and questions with help data
// Optional: ?clientId=xxx to apply client-specific overrides
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      console.error('[API] Supabase client is null');
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }
    
    // PERFORMANCE OPTIMIZATION: Execute all queries in parallel
    
    // Build query array - conditionally include overrides query if clientId provided
    const queries = [
      supabase.from('questionnaire_sections').select('*').order('sort_order'),
      supabase.from('questionnaire_questions').select('*').order('section_id, sort_order'),
      supabase.from('questionnaire_help').select('*'),
      ...(clientId ? [supabase.from('client_questionnaire_overrides').select('*').eq('client_id', clientId)] : [])
    ];
    
    // Execute all queries simultaneously
    const results = await Promise.all(queries);
    
    // Destructure results
    const { data: sections, error: sectionsError } = results[0];
    const { data: questions, error: questionsError } = results[1];
    const { data: help, error: helpError } = results[2];
    const overridesResult = results[3] || { data: null, error: null };
    const { data: overrides, error: overridesError } = overridesResult;
    
    // Error handling for all queries
    if (sectionsError) {
      console.error('[API] Sections error:', sectionsError);
      return NextResponse.json({ 
        error: sectionsError.message,
        code: sectionsError.code 
      }, { status: 500 });
    }
    
    if (questionsError) {
      console.error('[API] Questions error:', questionsError);
      return NextResponse.json({ 
        error: questionsError.message,
        code: questionsError.code 
      }, { status: 500 });
    }
    
    if (helpError) {
      console.error('[API] Help error:', helpError);
      return NextResponse.json({ 
        error: helpError.message,
        code: helpError.code 
      }, { status: 500 });
    }
    
    if (overridesError) {
      console.error('[API] Overrides error:', overridesError);
      // Don't fail - just continue without overrides
    }
    
    // Build override lookup maps
    let sectionOverrides: Record<number, { is_enabled: boolean; custom_text?: string; custom_help?: Record<string, unknown> }> = {};
    let questionOverrides: Record<string, { is_enabled: boolean; custom_text?: string; custom_help?: Record<string, unknown> }> = {};
    
    if (overrides) {
      for (const o of overrides) {
        if (o.section_id && o.override_type === 'section') {
          sectionOverrides[o.section_id] = {
            is_enabled: o.is_enabled,
            custom_text: o.custom_text || undefined,
            custom_help: o.custom_help || undefined
          };
        } else if (o.question_id) {
          questionOverrides[o.question_id] = {
            is_enabled: o.is_enabled,
            custom_text: o.custom_text || undefined,
            custom_help: o.custom_help || undefined
          };
        }
      }
    }
    
    // Merge sections with overrides
    const mergedSections = (sections || []).map(section => {
      const override = sectionOverrides[section.id];
      if (override) {
        // Read description from custom_help.description if present
        const customDescription = override.custom_help && typeof override.custom_help === 'object'
          ? (override.custom_help as Record<string, unknown>).description as string | null
          : null;
        
        return {
          ...section,
          enabled: override.is_enabled,
          title: override.custom_text || section.title,
          description: customDescription || section.description,
        };
      }
      return section;
    });
    
    // Combine questions with their help data AND overrides
    const questionsWithHelp = (questions || []).map(q => {
      const questionHelp = help?.find(h => h.question_id === q.id);
      const override = questionOverrides[q.id];
      
      // Merge custom_help if provided
      let mergedHelp = questionHelp;
      if (override?.custom_help && typeof override.custom_help === 'object') {
        mergedHelp = questionHelp 
          ? { ...questionHelp, ...override.custom_help }
          : override.custom_help;
      }
      
      if (override) {
        return {
          ...q,
          enabled: override.is_enabled,
          text: override.custom_text || q.text,
          help: mergedHelp
        };
      }
      
      return {
        ...q,
        help: questionHelp
      };
    });
    
    return NextResponse.json({
      sections: mergedSections,
      questions: questionsWithHelp
    });
    
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

