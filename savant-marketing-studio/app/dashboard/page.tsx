'use client'

import { motion } from 'framer-motion'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { metroContainerVariants, metroItemVariants, metroTileHover, metroTileTap } from '@/lib/animations'
import { useMobile, useScreenSize } from '@/hooks/use-mobile'
import { 
  Users, FolderKanban, FileText, TrendingUp, Clock, CheckCircle, 
  Database, Zap, AlertCircle, Target, ChevronRight, BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { DashboardSkeleton } from '@/components/skeleton-loader'
import { UrgentItems } from '@/components/urgent-items'
import { EmptyState } from '@/components/empty-state'
import { useState, useEffect, ReactNode } from 'react'

// Metro Typography Components
const MetroHeader = ({ children }: { children: ReactNode }) => (
  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wider mb-8 text-foreground">
    {children}
  </h1>
)

const MetroSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mb-12 md:mb-16">
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-wide mb-4 md:mb-6 text-foreground border-b-2 border-border pb-2">
      {title}
    </h2>
    {children}
  </section>
)

// Action Tile Component (replaces Quick Actions)
const ActionTile = ({ 
  icon, 
  label, 
  href, 
  count 
}: {
  icon: ReactNode
  label: string
  href: string
  count?: number
}) => {
  return (
    <Link href={href}>
      <SpotlightCard className="h-full">
        <motion.div
          className="p-6 md:p-8 aspect-square flex flex-col items-center justify-center gap-3 md:gap-4
            bg-surface hover:bg-surface-highlight transition-all cursor-pointer group
            relative overflow-hidden rounded-lg"
          whileHover={{ ...metroTileHover, scale: 1.02 }}
          whileTap={metroTileTap}
        >
          {/* Icon */}
          <div className="text-3xl md:text-4xl lg:text-5xl text-muted-foreground group-hover:text-red-primary transition-colors">
            {icon}
          </div>
          
          {/* Label */}
          <div className="text-base md:text-lg lg:text-xl font-bold uppercase tracking-wide text-center text-foreground">
            {label}
          </div>
          
          {/* Count badge (optional) */}
          {count !== undefined && (
            <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-primary/20 backdrop-blur-sm 
              px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-bold text-red-primary border border-red-primary/30">
              {count}
            </div>
          )}
          
          {/* Red accent line on hover */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </motion.div>
      </SpotlightCard>
    </Link>
  )
}

// Hero Tile Component (large featured tiles)
const HeroTile = ({ 
  icon, 
  title, 
  value, 
  subtitle
}: {
  icon: ReactNode
  title: string
  value: string | number
  subtitle: string
}) => (
  <SpotlightCard className="h-full group cursor-pointer">
    <div className="p-6 md:p-8 flex flex-col h-full">
      {/* Icon & Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-xl md:text-2xl text-muted-foreground group-hover:text-red-primary transition-colors">{icon}</div>
        <h3 className="text-xs md:text-sm uppercase tracking-wide text-muted-foreground font-semibold">
          {title}
        </h3>
      </div>
      
      {/* Big Number */}
      <div className="flex-1 flex items-center">
        <span className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-none">
          {value}
        </span>
      </div>
      
      {/* Subtitle */}
      <p className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-red-primary transition-colors mt-2">
        {subtitle}
      </p>
    </div>
  </SpotlightCard>
)

// Performance Tile Component (variable sizes)
const PerformanceTile = ({ 
  title, 
  value, 
  subtitle, 
  icon
}: {
  title: string
  value: string | number
  subtitle: string
  icon: ReactNode
}) => {
  return (
    <SpotlightCard className="h-full">
      <div className="p-4 md:p-6 flex flex-col justify-between h-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-base md:text-lg text-muted-foreground">{icon}</div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            {title}
          </span>
        </div>
        
        <div className="flex-1 flex items-center">
          <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {value}
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {subtitle}
        </p>
      </div>
    </SpotlightCard>
  )
}

// Activity Card Component (full-width)
const ActivityCard = ({ 
  activity 
}: { 
  activity: { 
    id: string
    type: string
    title: string
    client: string
    created_at: string
    href: string
  } 
}) => {
  const isMobile = useMobile()
  
  const iconBg = activity.type === 'project' 
    ? 'bg-info/20 text-info'
    : 'bg-success/20 text-success'

  const Icon = activity.type === 'project' ? FolderKanban : FileText

  return (
    <Link href={activity.href}>
      <SpotlightCard className="p-4 md:p-6 hover:border-red-primary/40 transition-all group cursor-pointer">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-base md:text-lg font-bold text-foreground truncate group-hover:text-red-primary transition-colors">
              {activity.title}
            </h4>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mt-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${iconBg}`}>
                {activity.type}
              </span>
              {activity.client && (
                <>
                  <span className="hidden md:inline">•</span>
                  <span className="truncate">{activity.client}</span>
                </>
              )}
              <span className="hidden md:inline">•</span>
              <span className="text-xs">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          {/* Arrow (desktop only) */}
          {!isMobile && (
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-primary transition-colors flex-shrink-0" />
          )}
        </div>
      </SpotlightCard>
    </Link>
  )
}

export default function DashboardPage() {
  // Screen size detection available for future responsive features
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isMobile, isTablet } = useScreenSize()

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
    <div className="space-y-8 md:space-y-12 pb-8 pt-4">
      {/* Metro Header */}
      <MetroHeader>DASHBOARD</MetroHeader>

      {/* Hero Stats - Large Tiles */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        variants={metroContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={metroItemVariants}>
          <HeroTile
            icon={<TrendingUp />}
            title="This Week"
            value={totalActivityThisWeek}
            subtitle={totalActivityThisWeek > 0 ? "Keep the momentum going!" : "Time to get started"}
          />
        </motion.div>
        <motion.div variants={metroItemVariants}>
          <HeroTile
            icon={<AlertCircle />}
            title="Due This Week"
            value={dueThisWeek}
            subtitle={dueThisWeek > 0 ? "Needs attention" : "Nothing urgent"}
          />
        </motion.div>
        <motion.div variants={metroItemVariants}>
          <HeroTile
            icon={<Target />}
            title="Focus"
            value={projectsByStatus.in_progress}
            subtitle={projectsByStatus.in_progress > 0 ? `${projectsByStatus.in_progress} projects in motion` : "Ready to start"}
          />
        </motion.div>
      </motion.div>

      {/* Urgent Items (if any) */}
      {urgentItems.length > 0 && (
        <div>
          <UrgentItems items={urgentItems} />
        </div>
      )}

      {/* Action Tiles - Replaces Quick Actions */}
      <MetroSection title="CREATE">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          variants={metroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={metroItemVariants}>
            <ActionTile
              icon={<FileText />}
              label="Content"
              href="/dashboard/content"
              count={totalContent}
            />
          </motion.div>
          <motion.div variants={metroItemVariants}>
            <ActionTile
              icon={<Users />}
              label="Client"
              href="/dashboard/clients/new"
              count={totalClients}
            />
          </motion.div>
          <motion.div variants={metroItemVariants}>
            <ActionTile
              icon={<FolderKanban />}
              label="Project"
              href="/dashboard/projects/board"
              count={totalProjects}
            />
          </motion.div>
          <motion.div variants={metroItemVariants}>
            <ActionTile
              icon={<BookOpen />}
              label="Note"
              href="/dashboard/journal"
            />
          </motion.div>
        </motion.div>
      </MetroSection>

      {/* Performance Metrics - Variable Size Grid */}
      <MetroSection title="PERFORMANCE">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[1fr]"
          variants={metroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={metroItemVariants}>
            <PerformanceTile 
              title="Content" 
              value={weeklyContent} 
              subtitle="Created last 7 days" 
              icon={<FileText />} 
            />
          </motion.div>
          <motion.div variants={metroItemVariants}>
            <PerformanceTile 
              title="Projects" 
              value={completedThisMonth} 
              subtitle={`${completionRate}% completion rate`} 
              icon={<CheckCircle />} 
            />
          </motion.div>
          <motion.div variants={metroItemVariants}>
            <PerformanceTile 
              title="Storage" 
              value={`${storageUsed} MB`} 
              subtitle={`${filesCount} files`} 
              icon={<Database />} 
            />
          </motion.div>
          <motion.div variants={metroItemVariants}>
            <PerformanceTile 
              title="Clients" 
              value={activeClients} 
              subtitle={`${inactiveClients} inactive`} 
              icon={<Users />} 
            />
          </motion.div>
          <motion.div variants={metroItemVariants}>
            <PerformanceTile 
              title="Due" 
              value={dueThisWeek} 
              subtitle={overdue > 0 ? `${overdue} overdue` : "On track"} 
              icon={<Clock />} 
            />
          </motion.div>
          <motion.div variants={metroItemVariants}>
            <PerformanceTile 
              title="Response" 
              value="< 24h" 
              subtitle="Last client update" 
              icon={<Zap />} 
            />
          </motion.div>
        </motion.div>
      </MetroSection>

      {/* Activity Stream - Full Width Cards */}
      <MetroSection title="RECENT ACTIVITY">
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
          <motion.div 
            className="space-y-3"
            variants={metroContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {recentActivity.map((activity) => (
              <motion.div key={activity.id} variants={metroItemVariants}>
                <ActivityCard activity={activity} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </MetroSection>

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
