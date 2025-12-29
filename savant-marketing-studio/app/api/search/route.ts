import { createClient } from '@/lib/supabase/server'
import { getClientName } from '@/lib/supabase/types'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()
  
  if (!supabase) {
    return NextResponse.json({ results: [] })
  }
  
  const searchQuery = `%${query.toLowerCase()}%`

  try {
    // Search clients (exclude soft-deleted)
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .ilike('name', searchQuery)
      .is('deleted_at', null)
      .limit(5)

    // Search projects (exclude soft-deleted)
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, clients(name)')
      .ilike('name', searchQuery)
      .is('deleted_at', null)
      .limit(5)

    // Search content (exclude soft-deleted)
    const { data: content } = await supabase
      .from('content_assets')
      .select('id, title, clients(name)')
      .ilike('title', searchQuery)
      .is('deleted_at', null)
      .limit(5)

    // Format results
    const results = [
      ...(clients || []).map(client => ({
        id: client.id,
        title: client.name,
        type: 'client' as const,
        url: `/dashboard/clients/${client.id}`,
      })),
      ...(projects || []).map(project => ({
        id: project.id,
        title: project.name,
        type: 'project' as const,
        subtitle: getClientName(project.clients),
        url: `/dashboard/projects/board`,
      })),
      ...(content || []).map(item => ({
        id: item.id,
        title: item.title,
        type: 'content' as const,
        subtitle: getClientName(item.clients),
        url: `/dashboard/content/${item.id}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ results: [] })
  }
}
