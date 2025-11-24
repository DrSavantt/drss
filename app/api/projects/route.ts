import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createSupabaseClient()

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*, clients(name)')
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error in projects API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
