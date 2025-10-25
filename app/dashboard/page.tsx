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
import { formatDistanceToNow, format } from 'date-fns'
import { DashboardSkeleton } from '@/components/skeleton-loader'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  // Helper functions
  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

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
    <div className="space-y-8 pb-8 pt-4">
      {/* Welcome + Today's Focus */}
      <div className="mb-8">
        {/* Welcome message */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-gray-400 mt-1">
            {getGreeting()} • {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Today's focus - compact 3-card row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* This week card */}
          <div className="bg-gradient-to-br from-[#4ECDC4]/20 to-[#4ECDC4]/5 border border-[#4ECDC4]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#4ECDC4]" />
              <span className="text-sm text-gray-400">This Week</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalActivityThisWeek}</div>
            <div className="text-xs text-[#4ECDC4] mt-1">
              Keep the momentum going!
            </div>
          </div>

          {/* Due today card */}
          <div className="bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF6B6B]/5 border border-[#FF6B6B]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#FF6B6B]" />
              <span className="text-sm text-gray-400">Due This Week</span>
            </div>
            <div className="text-2xl font-bold text-white">{dueThisWeek}</div>
            <div className="text-xs text-[#FF6B6B] mt-1">
              {dueThisWeek === 0 ? 'Nothing urgent' : 'Needs attention'}
            </div>
          </div>

          {/* Quick win card */}
          <div className="bg-gradient-to-br from-[#FFE66D]/20 to-[#FFE66D]/5 border border-[#FFE66D]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#FFE66D]" />
              <span className="text-sm text-gray-400">Focus</span>
            </div>
            <div className="text-sm text-white font-medium line-clamp-2">
              {projectsByStatus.in_progress > 0 
                ? `${projectsByStatus.in_progress} projects in motion` 
                : 'All systems go! 🚀'}
            </div>
          </div>
        </div>
      </div>

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
