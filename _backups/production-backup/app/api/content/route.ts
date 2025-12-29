import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    // Fetch all content assets with client information
    const { data: content, error } = await supabase
      .from('content_assets')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching content:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to include client_name at top level
    const transformedContent = content?.map(item => ({
      ...item,
      client_name: item.clients?.name || 'Unknown Client'
    })) || [];

    return NextResponse.json(transformedContent);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

