'use client'

import { useEffect, useState } from 'react'
import { StatCard } from "@/components/ui/stat-card"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { UrgentItems } from "@/components/dashboard/urgent-items"
import { Users, FolderKanban, FileText, Sparkles, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ============================================================================
// EXACT CODE FROM v0 - Only data fetching added, JSX unchanged
// Layout AppShell wrapper removed (handled by dashboard/layout.tsx)
// ============================================================================

interface ActivityItem {
  action: string
  client: string | null
  time: string
  created_at: string
  entity_type: string
  entity_id: string
  client_id?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState([
    { title: "Active Clients", value: 0, icon: Users, trend: { value: 0, isPositive: true }, href: "/dashboard/clients" },
    { title: "Active Projects", value: 0, icon: FolderKanban, trend: { value: 0, isPositive: true }, href: "/dashboard/projects/board" },
    { title: "Content Assets", value: 0, icon: FileText, href: "/dashboard/content" },
    { title: "AI Spend (MTD)", value: "$0.00", icon: Sparkles, href: "/dashboard/ai/generate" },
  ])

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [urgentProjects, setUrgentProjects] = useState<Array<any>>([])
  const [aiUsage, setAiUsage] = useState([
    { model: "Claude Sonnet 4", cost: 0, percentage: 0 },
    { model: "Claude Haiku 4", cost: 0, percentage: 0 },
    { model: "Claude Opus 4", cost: 0, percentage: 0 },
    { model: "Gemini Flash", cost: 0, percentage: 0 },
  ])

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Fetch real data from Supabase
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch metrics
        const metricsRes = await fetch('/api/metrics')
        const metrics = await metricsRes.json()
        
        // Update stats with real data
        setStats([
          { 
            title: "Active Clients", 
            value: metrics.clientHealth?.total || 0, 
            icon: Users, 
            trend: { value: metrics.clientHealth?.health || 0, isPositive: (metrics.clientHealth?.health || 0) >= 80 },
            href: "/dashboard/clients"
          },
          { 
            title: "Active Projects", 
            value: metrics.projectVelocity?.total || 0, 
            icon: FolderKanban, 
            trend: { value: metrics.projectVelocity?.completedThisWeek || 0, isPositive: true },
            href: "/dashboard/projects/board"
          },
          { 
            title: "Content Assets", 
            value: metrics.contentOutput?.total || 0, 
            icon: FileText,
            href: "/dashboard/content"
          },
          { 
            title: "AI Spend (MTD)", 
            value: "$0.00", // TODO: implement AI cost tracking
            icon: Sparkles,
            href: "/dashboard/ai/generate"
          },
        ])

        // Fetch activity log
        const activityRes = await fetch('/api/activity-log?limit=5')
        const activities = await activityRes.json()
        
        setRecentActivity(activities.map((a: any) => ({
          action: getActivityText(a),
          client: a.entity_name || null,
          time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
          created_at: a.created_at,
          entity_type: a.entity_type,
          entity_id: a.entity_id,
          client_id: a.client_id
        })))

        // Fetch urgent projects
        const projectsRes = await fetch('/api/projects')
        const projects = await projectsRes.json()
        
        // Filter projects with due dates that aren't done
        // Pass raw project data to UrgentItems component for its own calculations
        const urgent = projects
          .filter((p: any) => p.due_date && p.status !== 'done')
          .slice(0, 8) // Get more items since component will sort by urgency
        
        setUrgentProjects(urgent)

        // TODO: Fetch real AI usage data when implemented
        // For now, keep placeholder values

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, Jay</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <div className="cursor-pointer transition-all hover:scale-105">
              <StatCard {...stat} />
            </div>
          </Link>
        ))}
      </div>

      {/* Detailed Metrics - Expandable Cards */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Key Metrics</h2>
        <MetricCards />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const activityLink = getActivityLink(activity)
                return (
                  <div 
                    key={index} 
                    className={`flex items-start gap-3 ${activityLink ? 'cursor-pointer hover:bg-accent rounded-lg p-2 -m-2 transition-colors' : ''}`}
                    onClick={() => activityLink && router.push(activityLink)}
                  >
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      {activity.client && <p className="text-xs text-muted-foreground">{activity.client}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                      <div>{format(new Date(activity.created_at), 'MMM d, h:mm a')}</div>
                      <div className="text-muted-foreground/50">{activity.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Urgent Projects - Enhanced with production features */}
        <UrgentItems projects={urgentProjects} />
      </div>

      {/* AI Usage */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Usage This Month
          </CardTitle>
          <CardDescription>$12.45 / $50.00 budget (25% used)</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/4 rounded-full bg-primary transition-all" />
            </div>
          </div>

          {/* Model Breakdown */}
          <div className="space-y-4">
            {aiUsage.map((model) => (
              <div key={model.model} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{model.model}</span>
                  <span className="text-muted-foreground">${model.cost.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all"
                    style={{ width: `${model.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get navigation link for activity
function getActivityLink(activity: ActivityItem): string | null {
  switch (activity.entity_type) {
    case 'client':
      return `/dashboard/clients/${activity.entity_id}`
    case 'project':
      return activity.client_id ? `/dashboard/clients/${activity.client_id}` : '/dashboard/projects/board'
    case 'content':
      return `/dashboard/content/${activity.entity_id}`
    case 'questionnaire':
      return `/dashboard/clients/${activity.entity_id}`
    case 'framework':
      return '/dashboard/frameworks'
    default:
      return null
  }
}

// Helper function to format activity text
function getActivityText(activity: any) {
  const name = activity.entity_name || 'Item'
  
  switch (activity.activity_type) {
    case 'client_created': 
      return `Client created: ${name}`
    case 'project_created': 
      return `Project created: ${name}`
    case 'project_status_changed': 
      return `Project moved to ${activity.metadata?.new_status || 'new status'}`
    case 'content_created': 
      return `Content created: ${name}`
    case 'questionnaire_completed': 
      return `Questionnaire completed for ${name}`
    default: 
      return activity.activity_type.replace(/_/g, ' ')
  }
}
