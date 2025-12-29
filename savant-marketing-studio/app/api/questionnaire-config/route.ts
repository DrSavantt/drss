import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/questionnaire-config
// Returns all questionnaire sections and questions with help data
export async function GET() {
  console.log('[API] /api/questionnaire-config called');
  
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      console.error('[API] Supabase client is null');
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }
    
    console.log('[API] Fetching sections...');
    const { data: sections, error: sectionsError } = await supabase
      .from('questionnaire_sections')
      .select('*')
      .order('sort_order');
    
    if (sectionsError) {
      console.error('[API] Sections error:', sectionsError);
      return NextResponse.json({ 
        error: sectionsError.message,
        code: sectionsError.code 
      }, { status: 500 });
    }
    
    console.log('[API] Sections fetched:', sections?.length);
    
    console.log('[API] Fetching questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('questionnaire_questions')
      .select('*')
      .order('section_id, sort_order');
    
    if (questionsError) {
      console.error('[API] Questions error:', questionsError);
      return NextResponse.json({ 
        error: questionsError.message,
        code: questionsError.code 
      }, { status: 500 });
    }
    
    console.log('[API] Questions fetched:', questions?.length);
    
    console.log('[API] Fetching help...');
    const { data: help, error: helpError } = await supabase
      .from('questionnaire_help')
      .select('*');
    
    if (helpError) {
      console.error('[API] Help error:', helpError);
      return NextResponse.json({ 
        error: helpError.message,
        code: helpError.code 
      }, { status: 500 });
    }
    
    console.log('[API] Help fetched:', help?.length);
    
    // Combine questions with their help data
    const questionsWithHelp = (questions || []).map(q => ({
      ...q,
      help: help?.find(h => h.question_id === q.id)
    }));
    
    console.log('[API] Returning data successfully');
    
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

