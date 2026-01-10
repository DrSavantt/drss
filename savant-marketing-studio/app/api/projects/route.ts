import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');

  try {
    // Build query
    let query = supabase
      .from('projects')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .is('deleted_at', null);  // Exclude soft-deleted projects

    // Filter by client_id if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Fetch projects with client information
    const { data: projects, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to include client_name at top level
    const transformedProjects = projects?.map(project => ({
      ...project,
      client_name: project.clients?.name || 'Unknown Client'
    })) || [];

    const response = NextResponse.json(transformedProjects);
    
    // Cache for 30 seconds, allow stale-while-revalidate for 60 seconds
    response.headers.set(
      'Cache-Control',
      'private, s-maxage=30, stale-while-revalidate=60'
    );
    
    return response;
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

