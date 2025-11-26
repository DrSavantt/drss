import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { KanbanBoard } from './kanban-board'
import { LoadingSpinner } from '@/components/loading-spinner'

export default async function KanbanBoardPage() {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return (
      <div className="space-y-6 pt-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-red-primary">Projects Board</h1>
          <p className="text-silver">Database connection not configured. Please set Supabase environment variables.</p>
        </div>
      </div>
    )
  }
  
  // Get all projects with client info
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .order('position', { ascending: true })
  
  if (error) {
    console.error('Error fetching projects:', error)
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-red-primary">
          Projects Board
        </h1>
        <p className="text-silver">
          <span className="hidden sm:inline">Drag cards to change status • </span>Manage all projects across clients
        </p>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="bg-charcoal border-2 border-dashed border-mid-gray rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
          <p className="text-sm text-silver mb-6">
            Create a project from a client&apos;s page to get started.
          </p>
          <Link
            href="/dashboard/clients"
            className="inline-block bg-red-primary text-pure-white px-6 py-2.5 rounded-lg hover:bg-red-bright transition-all duration-200 text-sm font-medium"
          >
            Go to Clients
          </Link>
        </div>
      ) : (
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <KanbanBoard initialProjects={projects} />
        </Suspense>
      )}
    </div>
  )
}
