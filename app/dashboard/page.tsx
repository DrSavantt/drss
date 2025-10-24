import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createSupabaseClient()

  // Fetch all data
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, priority, due_date, created_at, clients(name)')
    .order('created_at', { ascending: false })

  const { data: content } = await supabase
    .from('content_assets')
    .select('id, title, asset_type, created_at, clients(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate stats
  const totalClients = clients?.length || 0
  const totalProjects = projects?.length || 0
  const totalContent = content?.length || 0

  const projectsByStatus = {
    backlog: projects?.filter(p => p.status === 'backlog').length || 0,
    in_progress: projects?.filter(p => p.status === 'in_progress').length || 0,
    in_review: projects?.filter(p => p.status === 'in_review').length || 0,
    done: projects?.filter(p => p.status === 'done').length || 0,
  }

  // Find urgent projects (due in next 7 days)
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const urgentProjects = projects?.filter(p => {
    if (!p.due_date) return false
    const dueDate = new Date(p.due_date)
    return dueDate >= now && dueDate <= sevenDaysFromNow && p.status !== 'done'
  }) || []

  // Recent activity (combine projects and content, sort by date)
  const recentActivity = [
    ...(projects?.slice(0, 5).map(p => ({
      id: p.id,
      title: p.name,
      type: 'project' as const,
      client: p.clients?.name,
      created_at: p.created_at,
    })) || []),
    ...(content?.slice(0, 5).map(c => ({
      id: c.id,
      title: c.title,
      type: 'content' as const,
      client: c.clients?.name,
      created_at: c.created_at,
    })) || []),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of all your clients, projects, and content
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clients */}
        <Link
          href="/dashboard/clients"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalClients}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Total Projects */}
        <Link
          href="/dashboard/projects/board"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProjects}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Active Projects */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {projectsByStatus.in_progress + projectsByStatus.in_review}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">In Progress</span>
              <span className="font-medium text-blue-600">{projectsByStatus.in_progress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Review</span>
              <span className="font-medium text-yellow-600">{projectsByStatus.in_review}</span>
            </div>
          </div>
        </div>

        {/* Total Content */}
        <Link
          href="/dashboard/content"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalContent}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Urgent Projects */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Urgent Projects</h2>
            <p className="text-sm text-gray-600 mt-1">Due in the next 7 days</p>
          </div>
          <div className="p-6">
            {urgentProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No urgent projects 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {project.clients && (
                          <span className="text-xs text-gray-600">
                            {project.clients.name}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            priorityColors[project.priority as keyof typeof priorityColors]
                          }`}
                        >
                          {project.priority}
                        </span>
                      </div>
                    </div>
                    {project.due_date && (
                      <div className="text-right ml-4">
                        <p className="text-xs font-medium text-orange-600">
                          {new Date(project.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-600 mt-1">Last 10 items created</p>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={
                      item.type === 'project'
                        ? '/dashboard/projects/board'
                        : `/dashboard/content/${item.id}`
                    }
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`mt-0.5 px-2 py-1 text-xs font-medium rounded-full ${
                        item.type === 'project'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.type === 'project' ? 'Project' : 'Content'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {item.client && <span>{item.client}</span>}
                        <span>•</span>
                        <span>
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Quick Actions</h2>
        <p className="text-blue-100 mb-6">Common tasks to get started</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/clients/new"
            className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4 hover:bg-opacity-30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">New Client</p>
                <p className="text-sm text-blue-100">Add a new client</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/projects/board"
            className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4 hover:bg-opacity-30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">View Projects</p>
                <p className="text-sm text-blue-100">Manage on Kanban</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/content"
            className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4 hover:bg-opacity-30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Content Library</p>
                <p className="text-sm text-blue-100">View all content</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
