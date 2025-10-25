import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getClientName } from '@/lib/supabase/types'
import { StatCard } from '@/components/stat-card'
import { UrgentItems } from '@/components/urgent-items'
import { QuickActions } from '@/components/quick-actions'
import { EmptyState } from '@/components/empty-state'
import { ProgressRing } from '@/components/progress-ring'
import { Users, FolderKanban, FileText, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createSupabaseClient()

  // Fetch all data
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, priority, due_date, created_at, client_id, clients(name)')
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

  // Calculate completion percentage
  const completionPercentage = totalProjects > 0 
    ? Math.round((projectsByStatus.done / totalProjects) * 100)
    : 0

  // Find urgent projects (due in next 3 days)
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const urgentProjects = projects?.filter(p => {
    if (!p.due_date) return false
    const dueDate = new Date(p.due_date)
    return dueDate >= now && dueDate <= threeDaysFromNow && p.status !== 'done'
  }) || []

  // Map urgent items
  const urgentItems = urgentProjects.map(p => ({
    id: p.id,
    title: p.name,
    subtitle: getClientName(p.clients),
    dueDate: p.due_date || undefined,
    href: `/dashboard/projects/board`,
    type: 'project' as const,
  }))

  // Recent activity (combine projects and content, sort by date)
  const recentActivity = [
    ...(projects?.slice(0, 5).map(p => ({
      id: p.id,
      title: p.name,
      type: 'project' as const,
      client: getClientName(p.clients),
      created_at: p.created_at,
      href: `/dashboard/projects/board`,
    })) || []),
    ...(content?.slice(0, 5).map(c => ({
      id: c.id,
      title: c.title,
      type: 'content' as const,
      client: getClientName(c.clients),
      created_at: c.created_at,
      href: `/dashboard/content/${c.id}`,
    })) || []),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  // Calculate "this week" metrics for hero
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const projectsThisWeek = projects?.filter(p => 
    new Date(p.created_at) >= oneWeekAgo
  ).length || 0
  const contentThisWeek = content?.filter(c =>
    new Date(c.created_at) >= oneWeekAgo
  ).length || 0

  const totalActivityThisWeek = projectsThisWeek + contentThisWeek

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section - Motivational Metric */}
      <div className="bg-gradient-to-br from-coral via-coral-dark to-coral rounded-2xl p-8 shadow-2xl shadow-coral/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-coral-dark/80 text-sm font-medium uppercase tracking-wide mb-2">
              This Week&apos;s Progress
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-6xl font-bold text-white">
                {totalActivityThisWeek}
              </h2>
              <span className="text-2xl text-white/80">items created</span>
            </div>
            <p className="mt-2 text-white/70 text-sm">
              Keep the momentum going! You&apos;re crushing it 🚀
            </p>
          </div>
          <div className="flex-shrink-0">
            <TrendingUp size={64} className="text-white/30" />
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Clients"
          value={totalClients}
          trend={totalClients > 0 ? {
            value: totalClients,
            isPositive: true,
            label: 'active'
          } : undefined}
          cta={{
            label: 'Manage clients',
            href: '/dashboard/clients'
          }}
          icon={<Users size={24} />}
        />

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 hover:border-mint/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
              Project Completion
            </p>
            <FolderKanban size={20} className="text-slate-600" />
          </div>
          <div className="flex items-center gap-6">
            <ProgressRing value={completionPercentage} size={80} color="#00D9A3" />
            <div>
              <p className="text-3xl font-bold text-white">{projectsByStatus.done}</p>
              <p className="text-sm text-slate-400">of {totalProjects} done</p>
            </div>
          </div>
          <Link
            href="/dashboard/projects/board"
            className="inline-flex items-center gap-1 mt-4 text-sm text-mint hover:text-mint/80 font-medium transition-colors"
          >
            View board →
          </Link>
        </div>

        <StatCard
          label="Content Assets"
          value={totalContent}
          trend={contentThisWeek > 0 ? {
            value: contentThisWeek,
            isPositive: true,
            label: 'this week'
          } : undefined}
          cta={{
            label: 'Browse library',
            href: '/dashboard/content'
          }}
          icon={<FileText size={24} />}
        />

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">
            Active Projects
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-3xl font-bold text-blue-400">{projectsByStatus.in_progress}</p>
              <p className="text-xs text-slate-500">In Progress</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber">{projectsByStatus.in_review}</p>
              <p className="text-xs text-slate-500">In Review</p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {projectsByStatus.backlog} in backlog
          </div>
        </div>
      </div>

      {/* Urgent Items Section */}
      {urgentItems.length > 0 && (
        <UrgentItems items={urgentItems} />
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity - Visual Timeline */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <Clock size={20} className="text-slate-600" />
        </div>

        {recentActivity.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No activity yet"
            description="Start by creating a client or project to see your activity here."
            cta={{
              label: 'Create your first client',
              href: '/dashboard/clients/new'
            }}
          />
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const isProject = activity.type === 'project'
              const iconBg = isProject ? 'bg-blue-500/10' : 'bg-mint/10'
              const iconColor = isProject ? 'text-blue-400' : 'text-mint'
              
              return (
                <Link
                  key={`${activity.type}-${activity.id}`}
                  href={activity.href}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-black/40 transition-all group"
                >
                  <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {isProject ? (
                      <FolderKanban size={18} className={iconColor} />
                    ) : (
                      <FileText size={18} className={iconColor} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate group-hover:text-coral transition-colors">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isProject ? 'bg-blue-500/20 text-blue-400' : 'bg-mint/20 text-mint'
                      }`}>
                        {activity.type}
                      </span>
                      {activity.client && (
                        <span className="text-xs text-slate-500">
                          {activity.client}
                        </span>
                      )}
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Empty State for No Clients */}
      {totalClients === 0 && (
        <EmptyState
          icon={Users}
          title="Welcome to DRSS!"
          description="Start by adding your first client to organize projects, content, and streamline your marketing operations."
          cta={{
            label: 'Add Your First Client',
            href: '/dashboard/clients/new'
          }}
        />
      )}
    </div>
  )
}
