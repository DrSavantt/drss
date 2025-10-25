'use client'

import { motion } from 'framer-motion'
import { StatCard } from '@/components/stat-card'
import { UrgentItems } from '@/components/urgent-items'
import { MetricCard } from '@/components/metric-card'
import { QuickActionButton } from '@/components/quick-action-button'
import { EmptyState } from '@/components/empty-state'
import { ProgressRing } from '@/components/progress-ring'
import { Users, FolderKanban, FileText, TrendingUp, Clock, Plus, CheckCircle, Database, Zap } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { DashboardSkeleton } from '@/components/skeleton-loader'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  interface ActivityItem {
    id: string
    type: string
    title: string
    client: string
    created_at: string
    href: string
  }

  interface UrgentItem {
    id: string
    title: string
    subtitle?: string
    dueDate?: string
    href: string
    type: 'project' | 'client' | 'content'
  }

  const [stats, setStats] = useState({
    totalClients: 0,
    totalProjects: 0,
    totalContent: 0,
    projectsByStatus: { backlog: 0, in_progress: 0, in_review: 0, done: 0 },
    completionPercentage: 0,
    urgentItems: [] as UrgentItem[],
    recentActivity: [] as ActivityItem[],
    totalActivityThisWeek: 0,
    projectsThisWeek: 0,
    contentThisWeek: 0,
    // Performance metrics
    weeklyContent: 0,
    completedThisMonth: 0,
    completionRate: 0,
    storageUsed: 0,
    filesCount: 0,
    activeClients: 0,
    inactiveClients: 0,
    dueThisWeek: 0,
    overdue: 0,
    contentTypes: { note: 0, file: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  const {
    totalClients,
    totalProjects,
    totalContent,
    projectsByStatus,
    completionPercentage,
    urgentItems,
    recentActivity,
    totalActivityThisWeek,
    // Performance metrics
    weeklyContent,
    completedThisMonth,
    completionRate,
    storageUsed,
    filesCount,
    activeClients,
    inactiveClients,
    dueThisWeek,
    overdue,
  } = stats

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section - Instant load with subtle hover */}
      <motion.div 
        className="bg-gradient-to-br from-coral via-coral-dark to-coral rounded-2xl p-8 shadow-2xl shadow-coral/20"
        whileHover={{ 
          scale: 1.005,  // Barely noticeable
          transition: { duration: 0.2 }
        }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-white/70 text-sm font-medium uppercase tracking-wide mb-2">
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
      </motion.div>

      {/* Primary Metrics Grid - Instant load */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
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
        </div>

        <div>
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 hover:border-mint/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                Project Completion
              </p>
              <FolderKanban size={20} className="text-slate-600" />
            </div>
            <div className="flex items-center gap-6">
              <div>
                <ProgressRing value={completionPercentage} size={80} color="#00D9A3" />
              </div>
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
        </div>

        <div>
          <StatCard
            label="Content Assets"
            value={totalContent}
            cta={{
              label: 'Browse library',
              href: '/dashboard/content'
            }}
            icon={<FileText size={24} />}
          />
        </div>

        <div>
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">
              Active Projects
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-3xl font-bold text-blue-400">{projectsByStatus.in_progress}</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-3xl font-bold text-amber">{projectsByStatus.in_review}</p>
                <p className="text-xs text-slate-500">In Review</p>
              </motion.div>
            </div>
            <div className="text-xs text-slate-500">
              {projectsByStatus.backlog} in backlog
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Items Section */}
      {urgentItems.length > 0 && (
        <div>
          <UrgentItems items={urgentItems} />
        </div>
      )}

      {/* Performance Metrics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Content This Week"
            value={weeklyContent}
            trend="Created in last 7 days"
            icon={TrendingUp}
            color="mint"
          />
          <MetricCard
            title="Projects Completed"
            value={completedThisMonth}
            trend={`${completionRate}% completion rate`}
            icon={CheckCircle}
            color="coral"
          />
          <MetricCard
            title="Storage Used"
            value={`${storageUsed} MB`}
            subtitle={`${filesCount} files`}
            icon={Database}
            color="amber"
          />
          <MetricCard
            title="Active Clients"
            value={activeClients}
            subtitle={`${inactiveClients} inactive`}
            icon={Users}
            color="mint"
          />
          <MetricCard
            title="Due This Week"
            value={dueThisWeek}
            trend={overdue > 0 ? `${overdue} overdue` : "On track"}
            icon={Clock}
            color={overdue > 0 ? "coral" : "mint"}
          />
          <MetricCard
            title="Avg Response Time"
            value="< 24h"
            subtitle="Last updated to client"
            icon={Zap}
            color="amber"
          />
        </div>
      </div>

      {/* Quick Actions - Compact */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <QuickActionButton 
            icon={Plus} 
            label="Content" 
            href="/dashboard/content"
            variant="primary"
          />
          <QuickActionButton 
            icon={Users} 
            label="Client" 
            href="/dashboard/clients/new"
            variant="secondary"
          />
          <QuickActionButton 
            icon={FolderKanban} 
            label="Project" 
            href="/dashboard/projects/board"
            variant="secondary"
          />
          <QuickActionButton 
            icon={FileText} 
            label="Note" 
            href="/dashboard/journal"
            variant="secondary"
          />
        </div>
      </div>

      {/* Recent Activity - Instant load */}
      <div>
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
                  <div
                    key={`${activity.type}-${activity.id}`}
                  >
                    <Link
                      href={activity.href}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-black/40 transition-all group"
                    >
                      <motion.div 
                        className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.15 }}
                      >
                        {isProject ? (
                          <FolderKanban size={18} className={iconColor} />
                        ) : (
                          <FileText size={18} className={iconColor} />
                        )}
                      </motion.div>
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
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Empty State for No Clients */}
      {totalClients === 0 && (
        <div>
          <EmptyState
            icon={Users}
            title="Welcome to DRSS!"
            description="Start by adding your first client to organize projects, content, and streamline your marketing operations."
            cta={{
              label: 'Add Your First Client',
              href: '/dashboard/clients/new'
            }}
          />
        </div>
      )}
    </div>
  )
}
