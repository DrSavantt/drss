import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  console.log('[Test API] Starting...');
  
  try {
    // Step 1: Test Supabase connection
    console.log('[Test API] Creating Supabase client...');
    const supabase = await createClient();
    
    if (!supabase) {
      console.error('[Test API] Supabase client is NULL');
      return NextResponse.json({ error: 'Supabase client is null' }, { status: 500 });
    }
    console.log('[Test API] Supabase client created ✓');
    
    // Step 2: Test simple query
    console.log('[Test API] Testing simple query...');
    const { data: testData, error: testError, count } = await supabase
      .from('questionnaire_sections')
      .select('*', { count: 'exact' });
    
    if (testError) {
      console.error('[Test API] Query error:', testError);
      return NextResponse.json({ 
        error: testError.message, 
        code: testError.code,
        details: testError.details,
        hint: testError.hint
      }, { status: 500 });
    }
    console.log('[Test API] Simple query worked ✓', 'Count:', count);
    
    // Step 3: Test full sections query
    console.log('[Test API] Fetching all sections...');
    const { data: sections, error: sectionsError } = await supabase
      .from('questionnaire_sections')
      .select('*')
      .order('sort_order');
    
    if (sectionsError) {
      console.error('[Test API] Sections error:', sectionsError);
      return NextResponse.json({ 
        error: sectionsError.message,
        step: 'sections'
      }, { status: 500 });
    }
    console.log('[Test API] Sections fetched:', sections?.length);
    
    // Step 4: Test questions query (help is now embedded in help_content column)
    console.log('[Test API] Fetching all questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('questionnaire_questions')
      .select('*')
      .order('section_id, sort_order');
    
    if (questionsError) {
      console.error('[Test API] Questions error:', questionsError);
      return NextResponse.json({ 
        error: questionsError.message,
        step: 'questions'
      }, { status: 500 });
    }
    console.log('[Test API] Questions fetched:', questions?.length);
    
    // Count questions with embedded help content
    const questionsWithHelp = questions?.filter(q => q.help_content !== null) || [];
    console.log('[Test API] Questions with help_content:', questionsWithHelp.length);
    
    console.log('[Test API] ALL QUERIES SUCCESSFUL ✓');
    
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

