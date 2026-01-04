import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/questionnaire-config
// Returns all questionnaire sections and questions with help data
// Note: Per-client overrides feature removed - returns global config only
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      console.error('[API] Supabase client is null');
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }
    
    // Execute all queries in parallel
    const [sectionsResult, questionsResult, helpResult] = await Promise.all([
      supabase.from('questionnaire_sections').select('*').order('sort_order'),
      supabase.from('questionnaire_questions').select('*').order('section_id, sort_order'),
      supabase.from('questionnaire_help').select('*'),
    ]);
    
    const { data: sections, error: sectionsError } = sectionsResult;
    const { data: questions, error: questionsError } = questionsResult;
    const { data: help, error: helpError } = helpResult;
    
    // Error handling
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
    
    // Combine questions with their help data
    const questionsWithHelp = (questions || []).map(q => ({
      ...q,
      help: help?.find(h => h.question_id === q.id)
    }));
    
    return NextResponse.json({
      sections: sections || [],
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
