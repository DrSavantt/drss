import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { KanbanBoard } from './kanban-board'
import { LoadingSpinner } from '@/components/loading-spinner'

export default async function KanbanBoardPage() {
  const supabase = await createSupabaseClient()
  
  // Get all projects with client info
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .order('position', { ascending: true })
  
  if (error) {
    console.error('Error fetching projects:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Project Board</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            <span className="hidden sm:inline">Drag cards to change status • </span>Manage all projects
          </p>
        </div>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">No projects yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Create a project from a client&apos;s page to get started.
          </p>
          <Link
            href="/dashboard/clients"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
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
