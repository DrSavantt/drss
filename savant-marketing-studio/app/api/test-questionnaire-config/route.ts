import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client is null' }, { status: 500 });
    }
    
    const { data: testData, error: testError, count } = await supabase
      .from('questionnaire_sections')
      .select('*', { count: 'exact' });
    
    if (testError) {
      return NextResponse.json({ 
        error: testError.message, 
        code: testError.code,
        details: testError.details,
        hint: testError.hint
      }, { status: 500 });
    }
    
    const { data: sections, error: sectionsError } = await supabase
      .from('questionnaire_sections')
      .select('*')
      .order('sort_order');
    
    if (sectionsError) {
      return NextResponse.json({ 
        error: sectionsError.message,
        step: 'sections'
      }, { status: 500 });
    }
    
    const { data: questions, error: questionsError } = await supabase
      .from('questionnaire_questions')
      .select('*')
      .order('section_id, sort_order');
    
    if (questionsError) {
      return NextResponse.json({ 
        error: questionsError.message,
        step: 'questions'
      }, { status: 500 });
    }
    
    const questionsWithHelp = questions?.filter(q => q.help_content !== null) || [];
    
    return NextResponse.json({
      success: true,
      sections: sections?.length || 0,
      questions: questions?.length || 0,
      questionsWithHelp: questionsWithHelp.length,
      sectionNames: sections?.map(s => s.title) || [],
      firstSection: sections?.[0] || null,
      firstQuestion: questions?.[0] || null
    });
    
  } catch (error) {
    console.error('[Test API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

