import { getClient } from '@/app/actions/clients'
import { getProjects } from '@/app/actions/projects'
import { getContentAssets } from '@/app/actions/content'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DeleteClientButton } from './delete-button'
import { FolderKanban, FileText, Calendar, Building2 } from 'lucide-react'

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
    low: 'bg-gray-700/50 text-gray-300',
    medium: 'bg-blue-600/50 text-blue-300',
    high: 'bg-orange-600/50 text-orange-300',
    urgent: 'bg-red-600/50 text-red-300',
  }

  const statusColors = {
    backlog: { bg: 'bg-gray-700', text: 'text-gray-300' },
    in_progress: { bg: 'bg-blue-600', text: 'text-white' },
    in_review: { bg: 'bg-yellow-600', text: 'text-white' },
    done: { bg: 'bg-green-600', text: 'text-white' },
  }

  const statusLabels = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header with back button and actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/clients"
            className="text-sm text-muted-foreground hover:text-[#4ECDC4] transition-colors flex items-center gap-2"
          >
            ← Back to Clients
          </Link>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            className="bg-card border border-card text-foreground px-5 py-2.5 rounded-lg hover:border-[#4ECDC4]/50 transition-all duration-200 text-sm font-medium"
          >
            Edit
          </Link>
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Client Header Card */}
      <div className="bg-card border border-card rounded-xl p-8 hover:border-[#4ECDC4]/50 transition-all duration-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] bg-clip-text text-transparent">
              {client.name}
            </h1>
            {client.email && (
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-muted/20 rounded">
                  <Building2 size={14} className="text-[#4ECDC4]" />
                </span>
                {client.email}
              </p>
            )}
            {client.website && (
              <a
                href={client.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-sm text-[#4ECDC4] hover:text-[#FF6B6B] transition-colors flex items-center gap-1"
              >
                {client.website} →
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-card pt-6 mt-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1.5 text-sm text-foreground">
                {new Date(client.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
              <dd className="mt-1.5 text-sm text-foreground">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <div className="bg-card border border-card rounded-xl p-6 hover:border-[#4ECDC4]/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                Total Projects
              </p>
              <p className="text-3xl font-bold text-foreground">{projects.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-600/10 rounded-lg flex items-center justify-center border border-blue-600/20">
              <FolderKanban size={24} className="text-[#4ECDC4]" />
            </div>
          </div>
        </div>

        {/* Projects by Status */}
        <div className="bg-card border border-card rounded-xl p-6 hover:border-[#4ECDC4]/50 transition-all duration-200">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-4">Projects by Status</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-semibold text-[#4ECDC4]">
                {projects.filter(p => p.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">In Review</span>
              <span className="font-semibold text-[#FFE66D]">
                {projects.filter(p => p.status === 'in_review').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Done</span>
              <span className="font-semibold text-green-400">
                {projects.filter(p => p.status === 'done').length}
              </span>
            </div>
          </div>
        </div>

        {/* Total Content */}
        <div className="bg-card border border-card rounded-xl p-6 hover:border-[#4ECDC4]/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                Total Content
              </p>
              <p className="text-3xl font-bold text-foreground">{content.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-600/10 rounded-lg flex items-center justify-center border border-green-600/20">
              <FileText size={24} className="text-green-400" />
            </div>
          </div>
        </div>

        {/* Content by Type */}
        <div className="bg-card border border-card rounded-xl p-6 hover:border-[#4ECDC4]/50 transition-all duration-200">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-4">Content by Type</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Notes</span>
              <span className="font-semibold text-green-400">
                {content.filter(c => c.asset_type === 'note').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Files</span>
              <span className="font-semibold text-purple-400">
                {content.filter(c => c.file_url).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-card border border-card rounded-xl p-8 hover:border-[#4ECDC4]/50 transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Recent Projects</h2>
            <p className="text-sm text-muted-foreground">Last 5 projects</p>
          </div>
          <Link
            href={`/dashboard/clients/${client.id}/projects/new`}
            className="bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 text-sm font-medium"
          >
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-card rounded-lg">
            <FolderKanban size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-base font-medium text-foreground mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get started by creating a new project.
            </p>
            <Link
              href={`/dashboard/clients/${client.id}/projects/new`}
              className="inline-block bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 text-sm font-medium"
            >
              + New Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/board`}
                className="border border-card rounded-lg p-5 hover:border-[#4ECDC4]/50 transition-all duration-200 block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-base font-semibold text-foreground">
                        {project.name}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          priorityColors[project.priority as keyof typeof priorityColors]
                        }`}
                      >
                        {project.priority}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        statusColors[project.status as keyof typeof statusColors].bg
                      } ${statusColors[project.status as keyof typeof statusColors].text}`}>
                        {statusLabels[project.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {project.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(project.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span>
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {projects.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/dashboard/projects/board"
                  className="text-sm text-[#4ECDC4] hover:text-[#FF6B6B] font-medium transition-colors"
                >
                  View all {projects.length} projects →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="bg-card border border-card rounded-xl p-8 hover:border-[#4ECDC4]/50 transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Recent Content</h2>
            <p className="text-sm text-muted-foreground">Last 5 items</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/clients/${client.id}/content/new`}
              className="bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 text-sm font-medium"
            >
              + New Content
            </Link>
            <Link
              href={`/dashboard/clients/${client.id}/files/new`}
              className="bg-card border border-card text-foreground px-5 py-2.5 rounded-lg hover:border-[#4ECDC4]/50 transition-all duration-200 text-sm font-medium"
            >
              ↑ Upload
            </Link>
          </div>
        </div>

        {content.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-card rounded-lg">
            <FileText size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-base font-medium text-foreground mb-2">No content yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get started by creating your first note.
            </p>
            <Link
              href={`/dashboard/clients/${client.id}/content/new`}
              className="inline-block bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 text-sm font-medium"
            >
              + New Content
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {content.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="border border-card rounded-lg p-5 hover:border-[#4ECDC4]/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-base font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-600/20 text-green-400 border border-green-600/30">
                        {item.asset_type}
                      </span>
                      {item.projects && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-600/20 text-purple-400 border border-purple-600/30">
                          {item.projects.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                        className="text-sm text-green-400 hover:text-green-300 font-medium transition-colors"
                      >
                        Download ↓
                      </a>
                    ) : (
                      <Link
                        href={`/dashboard/content/${item.id}`}
                        className="text-sm text-[#4ECDC4] hover:text-[#FF6B6B] font-medium transition-colors"
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
                  className="text-sm text-[#4ECDC4] hover:text-[#FF6B6B] font-medium transition-colors"
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
