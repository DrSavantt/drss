'use client'

import { motion } from 'framer-motion'
import { StatCard } from '@/components/stat-card'
import { UrgentItems } from '@/components/urgent-items'
import { QuickActions } from '@/components/quick-actions'
import { EmptyState } from '@/components/empty-state'
import { ProgressRing } from '@/components/progress-ring'
import { ScrollReveal } from '@/components/scroll-reveal'
import { Users, FolderKanban, FileText, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fadeInUp, staggerContainer, pageTransition } from '@/lib/animations'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProjects: 0,
    totalContent: 0,
    projectsByStatus: { backlog: 0, in_progress: 0, in_review: 0, done: 0 },
    completionPercentage: 0,
    urgentItems: [] as any[],
    recentActivity: [] as any[],
    totalActivityThisWeek: 0,
    projectsThisWeek: 0,
    contentThisWeek: 0,
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
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-slate-800 border-t-coral rounded-full mx-auto mb-4"
          />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
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
    projectsThisWeek,
    contentThisWeek,
  } = stats

  return (
    <motion.div 
      className="space-y-8 pb-8"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      {/* Hero Section - Animated entrance */}
      <motion.div 
        className="bg-gradient-to-br from-coral via-coral-dark to-coral rounded-2xl p-8 shadow-2xl shadow-coral/20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.01, boxShadow: '0 25px 50px rgba(255, 107, 107, 0.3)' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-white/70 text-sm font-medium uppercase tracking-wide mb-2">
              This Week&apos;s Progress
            </p>
            <div className="flex items-baseline gap-3">
              <motion.h2 
                className="text-6xl font-bold text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {totalActivityThisWeek}
              </motion.h2>
              <span className="text-2xl text-white/80">items created</span>
            </div>
            <p className="mt-2 text-white/70 text-sm">
              Keep the momentum going! You&apos;re crushing it 🚀
            </p>
          </div>
          <motion.div 
            className="flex-shrink-0"
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <TrendingUp size={64} className="text-white/30" />
          </motion.div>
        </div>
      </motion.div>

      {/* Primary Metrics Grid - Stagger animation */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp}>
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
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 hover:border-mint/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                Project Completion
              </p>
              <FolderKanban size={20} className="text-slate-600" />
            </div>
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.3, type: 'spring' }}
              >
                <ProgressRing value={completionPercentage} size={80} color="#00D9A3" />
              </motion.div>
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
        </motion.div>

        <motion.div variants={fadeInUp}>
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
        </motion.div>

        <motion.div variants={fadeInUp}>
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">
              Active Projects
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-3xl font-bold text-blue-400">{projectsByStatus.in_progress}</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-3xl font-bold text-amber">{projectsByStatus.in_review}</p>
                <p className="text-xs text-slate-500">In Review</p>
              </motion.div>
            </div>
            <div className="text-xs text-slate-500">
              {projectsByStatus.backlog} in backlog
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Urgent Items Section */}
      {urgentItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <UrgentItems items={urgentItems} />
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <QuickActions />
      </motion.div>

      {/* Recent Activity - Scroll reveal */}
      <ScrollReveal>
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
              {recentActivity.map((activity, index) => {
                const isProject = activity.type === 'project'
                const iconBg = isProject ? 'bg-blue-500/10' : 'bg-mint/10'
                const iconColor = isProject ? 'text-blue-400' : 'text-mint'
                
                return (
                  <motion.div
                    key={`${activity.type}-${activity.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={activity.href}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-black/40 transition-all group"
                    >
                      <motion.div 
                        className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
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
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Empty State for No Clients */}
      {totalClients === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <EmptyState
            icon={Users}
            title="Welcome to DRSS!"
            description="Start by adding your first client to organize projects, content, and streamline your marketing operations."
            cta={{
              label: 'Add Your First Client',
              href: '/dashboard/clients/new'
            }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
