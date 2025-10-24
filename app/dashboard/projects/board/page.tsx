import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

  // Group projects by status
  const backlog = projects?.filter(p => p.status === 'backlog') || []
  const inProgress = projects?.filter(p => p.status === 'in_progress') || []
  const inReview = projects?.filter(p => p.status === 'in_review') || []
  const done = projects?.filter(p => p.status === 'done') || []

  const columns = [
    { id: 'backlog', title: 'Backlog', projects: backlog, color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', projects: inProgress, color: 'bg-blue-100' },
    { id: 'in_review', title: 'In Review', projects: inReview, color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', projects: done, color: 'bg-green-100' },
  ]

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Board</h1>
          <p className="mt-2 text-gray-600">
            Manage all projects across clients
          </p>
        </div>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">No projects yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Create a project from a client's page to get started.
          </p>
          <Link
            href="/dashboard/clients"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Go to Clients
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={`${column.color} rounded-t-lg px-4 py-3 border-b-2 border-gray-300`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">{column.title}</h2>
                  <span className="text-sm font-medium text-gray-600">
                    {column.projects.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 bg-gray-50 rounded-b-lg p-4 space-y-3 min-h-[500px]">
                {column.projects.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                    No projects
                  </div>
                ) : (
                  column.projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {/* Project Name */}
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {project.name}
                      </h3>

                      {/* Description Preview */}
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Client Badge */}
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {project.clients?.name || 'Unknown Client'}
                        </span>
                      </div>

                      {/* Priority & Due Date */}
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`px-2 py-1 rounded-full font-medium ${
                            priorityColors[project.priority as keyof typeof priorityColors]
                          }`}
                        >
                          {project.priority}
                        </span>
                        {project.due_date && (
                          <span className="text-gray-500">
                            Due: {new Date(project.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
