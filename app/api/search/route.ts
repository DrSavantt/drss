import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()
  const searchQuery = `%${query.toLowerCase()}%`

  try {
    // Search clients
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .ilike('name', searchQuery)
      .limit(5)

    // Search projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, clients(name)')
      .ilike('name', searchQuery)
      .limit(5)

    // Search content
    const { data: content } = await supabase
      .from('content_assets')
      .select('id, title, clients(name)')
      .ilike('title', searchQuery)
      .limit(5)

    // Format results
    const results = [
      ...(clients || []).map(client => ({
        id: client.id,
        title: client.name,
        type: 'client' as const,
        url: `/dashboard/clients/${client.id}`,
      })),
      ...(projects || []).map(project => {
        const clientData = project.clients as { name: string } | { name: string }[] | null
        const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name
        return {
          id: project.id,
          title: project.name,
          type: 'project' as const,
          subtitle: clientName,
          url: `/dashboard/projects/board`,
        }
      }),
      ...(content || []).map(item => {
        const clientData = item.clients as { name: string } | { name: string }[] | null
        const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name
        return {
          id: item.id,
          title: item.title,
          type: 'content' as const,
          subtitle: clientName,
          url: `/dashboard/content/${item.id}`,
        }
      }),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ results: [] })
  }
}
