import { getClient } from '@/app/actions/clients'
import { getProjects } from '@/app/actions/projects'
import { getContentAssets } from '@/app/actions/content'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DeleteClientButton } from './delete-button'
import { ClientCaptures } from './client-captures'
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
    low: 'bg-slate/50 text-light-gray',
    medium: 'bg-info/50 text-info',
    high: 'bg-warning/50 text-warning',
    urgent: 'bg-red-primary/50 text-red-light',
  }

  const statusColors = {
    backlog: { bg: 'bg-slate', text: 'text-light-gray' },
    in_progress: { bg: 'bg-info', text: 'text-pure-white' },
    in_review: { bg: 'bg-warning', text: 'text-pure-black' },
    done: { bg: 'bg-success', text: 'text-pure-white' },
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
            className="text-sm text-silver hover:text-red-primary transition-colors flex items-center gap-2"
          >
            ← Back to Clients
          </Link>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            className="bg-charcoal border border-mid-gray text-foreground px-5 py-2.5 rounded-lg hover:border-red-bright/50 transition-all duration-200 text-sm font-medium"
          >
            Edit
          </Link>
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Client Header Card */}
      <div className="bg-charcoal border border-mid-gray rounded-xl p-8 hover:border-red-bright/50 transition-all duration-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 text-red-primary">
              {client.name}
            </h1>
            {client.email && (
              <p className="text-silver flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-dark-gray rounded">
                  <Building2 size={14} className="text-red-primary" />
                </span>
                {client.email}
              </p>
            )}
            {client.website && (
              <a
                href={client.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-sm text-red-primary hover:text-red-bright transition-colors flex items-center gap-1"
              >
                {client.website} →
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-mid-gray pt-6 mt-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-silver">Created</dt>
              <dd className="mt-1.5 text-sm text-foreground">
                {new Date(client.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-silver">Last Updated</dt>
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

        {/* Quick Captures - Collapsible */}
        <ClientCaptures clientId={client.id} clientName={client.name} />
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <div className="bg-charcoal border border-mid-gray rounded-xl p-6 hover:border-red-bright/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-silver uppercase tracking-wide font-medium mb-1">
                Total Projects
              </p>
              <p className="text-3xl font-bold text-foreground">{projects.length}</p>
            </div>
            <div className="h-12 w-12 bg-info/10 rounded-lg flex items-center justify-center border border-info/20">
              <FolderKanban size={24} className="text-info" />
            </div>
          </div>
        </div>

        {/* Projects by Status */}
        <div className="bg-charcoal border border-mid-gray rounded-xl p-6 hover:border-red-bright/50 transition-all duration-200">
          <p className="text-xs text-silver uppercase tracking-wide font-medium mb-4">Projects by Status</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-silver">In Progress</span>
              <span className="font-semibold text-info">
                {projects.filter(p => p.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-silver">In Review</span>
              <span className="font-semibold text-warning">
                {projects.filter(p => p.status === 'in_review').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-silver">Done</span>
              <span className="font-semibold text-success">
                {projects.filter(p => p.status === 'done').length}
              </span>
            </div>
          </div>
        </div>

        {/* Total Content */}
        <div className="bg-charcoal border border-mid-gray rounded-xl p-6 hover:border-red-bright/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-silver uppercase tracking-wide font-medium mb-1">
                Total Content
              </p>
              <p className="text-3xl font-bold text-foreground">{content.length}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center border border-success/20">
              <FileText size={24} className="text-success" />
            </div>
          </div>
        </div>

        {/* Content by Type */}
        <div className="bg-charcoal border border-mid-gray rounded-xl p-6 hover:border-red-bright/50 transition-all duration-200">
          <p className="text-xs text-silver uppercase tracking-wide font-medium mb-4">Content by Type</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-silver">Notes</span>
              <span className="font-semibold text-success">
                {content.filter(c => c.asset_type === 'note').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-silver">Files</span>
              <span className="font-semibold text-info">
                {content.filter(c => c.file_url).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-charcoal border border-mid-gray rounded-xl p-8 hover:border-red-bright/50 transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Recent Projects</h2>
            <p className="text-sm text-silver">Last 5 projects</p>
          </div>
          <Link
            href={`/dashboard/clients/${client.id}/projects/new`}
            className="bg-red-primary text-pure-white px-5 py-2.5 rounded-lg hover:bg-red-bright transition-all duration-200 text-sm font-medium"
          >
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-mid-gray rounded-lg">
            <FolderKanban size={48} className="mx-auto text-slate mb-4" />
            <h3 className="text-base font-medium text-foreground mb-2">No projects yet</h3>
            <p className="text-sm text-silver mb-6">
              Get started by creating a new project.
            </p>
            <Link
              href={`/dashboard/clients/${client.id}/projects/new`}
              className="inline-block bg-red-primary text-pure-white px-5 py-2.5 rounded-lg hover:bg-red-bright transition-all duration-200 text-sm font-medium"
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
                className="border border-mid-gray rounded-lg p-5 hover:border-red-bright/50 transition-all duration-200 block"
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
                      <p className="text-sm text-silver mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate">
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
                  className="text-sm text-red-primary hover:text-red-bright font-medium transition-colors"
                >
                  View all {projects.length} projects →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="bg-charcoal border border-mid-gray rounded-xl p-8 hover:border-red-bright/50 transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Recent Content</h2>
            <p className="text-sm text-silver">Last 5 items</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/clients/${client.id}/content/new`}
              className="bg-red-primary text-pure-white px-5 py-2.5 rounded-lg hover:bg-red-bright transition-all duration-200 text-sm font-medium"
            >
              + New Content
            </Link>
            <Link
              href={`/dashboard/clients/${client.id}/files/new`}
              className="bg-charcoal border border-mid-gray text-foreground px-5 py-2.5 rounded-lg hover:border-red-bright/50 transition-all duration-200 text-sm font-medium"
            >
              ↑ Upload
            </Link>
          </div>
        </div>

        {content.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-mid-gray rounded-lg">
            <FileText size={48} className="mx-auto text-slate mb-4" />
            <h3 className="text-base font-medium text-foreground mb-2">No content yet</h3>
            <p className="text-sm text-silver mb-6">
              Get started by creating your first note.
            </p>
            <Link
              href={`/dashboard/clients/${client.id}/content/new`}
              className="inline-block bg-red-primary text-pure-white px-5 py-2.5 rounded-lg hover:bg-red-bright transition-all duration-200 text-sm font-medium"
            >
              + New Content
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {content.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="border border-mid-gray rounded-lg p-5 hover:border-red-bright/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-base font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-success/20 text-success border border-success/30">
                        {item.asset_type}
                      </span>
                      {item.projects && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-info/20 text-info border border-info/30">
                          {item.projects.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate">
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
                  <Link
                    href={`/dashboard/content/${item.id}`}
                    className="text-sm text-red-primary hover:text-red-bright font-medium transition-colors"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}

            {content.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/dashboard/content"
                  className="text-sm text-red-primary hover:text-red-bright font-medium transition-colors"
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
