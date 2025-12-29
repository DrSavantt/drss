import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    // Fetch all frameworks
    const { data: frameworks, error } = await supabase
      .from('marketing_frameworks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching frameworks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each framework, count chunks
    const frameworksWithChunks = await Promise.all(
      (frameworks || []).map(async (framework) => {
        const { count: chunkCount } = await supabase
          .from('framework_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('framework_id', framework.id);

        return {
          ...framework,
          chunk_count: chunkCount || 0,
        };
      })
    );

    return NextResponse.json(frameworksWithChunks);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

