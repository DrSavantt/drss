import { getClient } from '@/app/actions/clients'
import { getProjects } from '@/app/actions/projects'
import { getContentAssets } from '@/app/actions/content'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DeleteClientButton } from './delete-button'

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const client = await getClient(params.id)
  const projects = await getProjects(params.id)
  const content = await getContentAssets(params.id)

  if (!client) {
    notFound()
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const statusLabels = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/clients"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to Clients
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            {client.email && (
              <p className="mt-2 text-gray-600">{client.email}</p>
            )}
            {client.website && (
              <a
                href={client.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {client.website} ↗
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/clients/${client.id}/edit`}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Edit
            </Link>
            <DeleteClientButton clientId={client.id} clientName={client.name} />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(client.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(client.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Projects */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{projects.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Projects by Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-3">Projects by Status</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">In Progress</span>
              <span className="font-semibold text-blue-600">
                {projects.filter(p => p.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">In Review</span>
              <span className="font-semibold text-yellow-600">
                {projects.filter(p => p.status === 'in_review').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Done</span>
              <span className="font-semibold text-green-600">
                {projects.filter(p => p.status === 'done').length}
              </span>
            </div>
          </div>
        </div>

        {/* Total Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{content.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content by Type */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-3">Content by Type</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Notes</span>
              <span className="font-semibold text-green-600">
                {content.filter(c => c.asset_type === 'note').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Files</span>
              <span className="font-semibold text-purple-600">
                {content.filter(c => c.file_url).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
            <p className="text-sm text-gray-600 mt-1">Last 5 projects</p>
          </div>
          <Link
            href={`/dashboard/clients/${client.id}/projects/new`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900">No projects yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new project.
            </p>
            <Link
              href={`/dashboard/clients/${client.id}/projects/new`}
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              + New Project
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          priorityColors[project.priority as keyof typeof priorityColors]
                        }`}
                      >
                        {project.priority}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {statusLabels[project.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {project.due_date && (
                        <span>
                          Due: {new Date(project.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span>
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {projects.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/dashboard/projects/board"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all {projects.length} projects →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Content</h2>
            <p className="text-sm text-gray-600 mt-1">Last 5 items</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/clients/${client.id}/content/new`}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              + New Content
            </Link>
            <Link
              href={`/dashboard/clients/${client.id}/files/new`}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
            >
              ↑ Upload File
            </Link>
          </div>
        </div>

        {content.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900">No content yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first note.
            </p>
            <Link
              href={`/dashboard/clients/${client.id}/content/new`}
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              + New Content
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {content.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {item.asset_type}
                      </span>
                      {item.projects && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {item.projects.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Created: {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.file_size && (
                        <span>
                          Size: {(item.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {item.file_url ? (
                      <a
                        href={item.file_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Download ↓
                      </a>
                    ) : (
                      <Link
                        href={`/dashboard/content/${item.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {content.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/dashboard/content"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all {content.length} items →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

