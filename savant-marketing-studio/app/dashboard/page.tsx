'use client'

import { useEffect, useState } from 'react'
import { WidgetCard } from '@/components/dashboard/widget-card'
import { Button } from '@/components/ui/button'
import {
  Users,
  FolderKanban,
  Search,
  BookOpen,
  Sparkles,
  FileText,
  BookMarked,
  BarChart3,
  Archive,
  Plus,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface DashboardData {
  clients: {
    total: number
    active: number
    recent: Array<{ id: string; name: string; projectCount: number }>
  }
  projects: {
    total: number
    active: number
    overdue: number
    byStatus: { backlog: number; in_progress: number; in_review: number; done: number }
  }
  content: {
    total: number
    thisWeek: number
    recent: Array<{ id: string; title: string; asset_type: string }>
  }
  frameworks: {
    total: number
    recent: Array<{ id: string; title: string }>
  }
  ai: {
    generations: number
    spend: number
    tokensUsed: number
  }
  journal: {
    totalEntries: number
    lastEntry: { id: string; content: string; created_at: string } | null
  }
  analytics: {
    clients: number
    projects: number
    content: number
    aiSpend: number
  }
  archive: {
    total: number
    recent: Array<{ id: string; name: string; type: string }>
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      // Fetch all widget data
      const [clientsRes, projectsRes, contentRes, aiStatsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/projects'),
        fetch('/api/content'),
        fetch('/api/analytics?days=30'),
      ])

      const clients = await clientsRes.json()
      const projects = await projectsRes.json()
      const content = await contentRes.json()
      const analytics = await aiStatsRes.json()

      // Calculate project counts
      const projectsByStatus = {
        backlog: projects.filter((p: any) => p.status === 'backlog').length,
        in_progress: projects.filter((p: any) => p.status === 'in_progress').length,
        in_review: projects.filter((p: any) => p.status === 'in_review').length,
        done: projects.filter((p: any) => p.status === 'done').length,
      }

      const activeProjects = projects.filter((p: any) => p.status !== 'done')
      const overdueProjects = projects.filter((p: any) => 
        p.due_date && new Date(p.due_date) < new Date() && p.status !== 'done'
      )

      // Get client project counts
      const clientProjectCounts = clients.map((client: any) => ({
        id: client.id,
        name: client.name,
        projectCount: projects.filter((p: any) => p.client_id === client.id).length
      }))

      // Content this week
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const contentThisWeek = content.filter((c: any) => 
        new Date(c.created_at) > oneWeekAgo
      ).length

      setData({
        clients: {
          total: clients.length,
          active: clients.filter((c: any) => !c.deleted_at).length,
          recent: clientProjectCounts.slice(0, 3)
        },
        projects: {
          total: projects.length,
          active: activeProjects.length,
          overdue: overdueProjects.length,
          byStatus: projectsByStatus
        },
        content: {
          total: content.length,
          thisWeek: contentThisWeek,
          recent: content.slice(0, 3)
        },
        frameworks: {
          total: 0, // TODO: Fetch frameworks when available
          recent: []
        },
        ai: {
          generations: analytics.stats?.aiGenerations || 0,
          spend: analytics.stats?.totalAICost || 0,
          tokensUsed: analytics.stats?.totalTokens || 0
        },
        journal: {
          totalEntries: analytics.stats?.journalEntries || 0,
          lastEntry: null // TODO: Fetch last journal entry
        },
        analytics: {
          clients: clients.length,
          projects: projects.length,
          content: content.length,
          aiSpend: analytics.stats?.totalAICost || 0
        },
        archive: {
          total: analytics.stats?.archivedClients || 0,
          recent: []
        }
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
    return tokens.toString()
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* 3x3 Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Clients Widget */}
        <WidgetCard
          title="Clients"
          icon={<Users className="w-5 h-5" />}
          href="/dashboard/clients"
        >
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-foreground">{data.clients.active}</p>
              <p className="text-sm text-muted-foreground">active clients</p>
            </div>

            {data.clients.recent.length > 0 && (
              <div className="space-y-2">
                {data.clients.recent.map((client) => (
                  <div
                    key={client.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-foreground truncate">{client.name}</span>
                    <span className="text-muted-foreground flex-shrink-0 ml-2">
                      {client.projectCount} {client.projectCount === 1 ? 'project' : 'projects'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-auto"
              onClick={() => router.push('/dashboard/clients')}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Client
            </Button>
          </div>
        </WidgetCard>

        {/* 2. Projects Widget */}
        <WidgetCard
          title="Projects"
          icon={<FolderKanban className="w-5 h-5" />}
          href="/dashboard/projects/board"
        >
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{data.projects.active}</span>
              <span className="text-sm text-muted-foreground">active</span>
              {data.projects.overdue > 0 && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {data.projects.overdue} overdue
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold text-foreground">{data.projects.byStatus.backlog}</p>
                <p className="text-xs text-muted-foreground">Backlog</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{data.projects.byStatus.in_progress}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{data.projects.byStatus.in_review}</p>
                <p className="text-xs text-muted-foreground">Review</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{data.projects.byStatus.done}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push('/dashboard/projects/board')}
            >
              <Plus className="w-4 h-4 mr-1" /> New Project
            </Button>
          </div>
        </WidgetCard>

        {/* 3. Deep Research Widget */}
        <WidgetCard
          title="Deep Research"
          icon={<Search className="w-5 h-5" />}
          href="/dashboard/research"
        >
          <div className="flex flex-col h-full">
            <p className="text-muted-foreground text-sm mb-4">
              AI-powered research assistant for in-depth client and market analysis
            </p>
            <div className="flex-1 flex items-center justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/research')}
              >
                <Search className="w-4 h-4 mr-2" />
                Start Research
              </Button>
            </div>
          </div>
        </WidgetCard>

        {/* 4. Frameworks Widget */}
        <WidgetCard
          title="Frameworks"
          icon={<BookOpen className="w-5 h-5" />}
          href="/dashboard/frameworks"
        >
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-foreground">15+</p>
              <p className="text-sm text-muted-foreground">copywriting frameworks</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Popular frameworks</p>
              <div className="space-y-1">
                <p className="text-sm text-foreground">• AIDA (Attention, Interest, Desire, Action)</p>
                <p className="text-sm text-foreground">• PAS (Problem, Agitate, Solution)</p>
                <p className="text-sm text-foreground">• BAB (Before, After, Bridge)</p>
              </div>
            </div>
          </div>
        </WidgetCard>

        {/* 5. AI Studio Widget */}
        <WidgetCard
          title="AI Studio"
          icon={<Sparkles className="w-5 h-5" />}
          href="/dashboard/ai/generate"
        >
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{data.ai.generations}</p>
                <p className="text-xs text-muted-foreground">generations</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  ${data.ai.spend.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">this month</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick generate</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/ai/generate?type=email')}
                >
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/ai/generate?type=ad')}
                >
                  Ad
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/ai/generate?type=blog')}
                >
                  Blog
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/ai/generate?type=landing')}
                >
                  Landing
                </Button>
              </div>
            </div>

            {data.ai.tokensUsed > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {formatTokens(data.ai.tokensUsed)} tokens used
                </p>
              </div>
            )}
          </div>
        </WidgetCard>

        {/* 6. Content Widget */}
        <WidgetCard
          title="Content"
          icon={<FileText className="w-5 h-5" />}
          href="/dashboard/content"
        >
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{data.content.total}</span>
              <span className="text-sm text-muted-foreground">pieces</span>
              {data.content.thisWeek > 0 && (
                <span className="text-green-500 text-sm flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {data.content.thisWeek} this week
                </span>
              )}
            </div>

            {data.content.recent.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Recent content</p>
                {data.content.recent.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate text-foreground">{item.title}</span>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push('/dashboard/content')}
            >
              <Plus className="w-4 h-4 mr-1" /> Create Content
            </Button>
          </div>
        </WidgetCard>

        {/* 7. Journal Widget */}
        <WidgetCard
          title="Journal"
          icon={<BookMarked className="w-5 h-5" />}
          href="/dashboard/journal"
        >
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-foreground">{data.journal.totalEntries}</p>
              <p className="text-sm text-muted-foreground">entries</p>
            </div>

            {data.journal.lastEntry ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Last entry: {formatDistanceToNow(new Date(data.journal.lastEntry.created_at), { addSuffix: true })}
                  </p>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-foreground line-clamp-3">
                      {data.journal.lastEntry.content}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No entries yet. Start capturing ideas!</p>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push('/dashboard/journal')}
            >
              <Plus className="w-4 h-4 mr-1" /> New Entry
            </Button>
          </div>
        </WidgetCard>

        {/* 8. Analytics Widget */}
        <WidgetCard
          title="Analytics"
          icon={<BarChart3 className="w-5 h-5" />}
          href="/dashboard/analytics"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">This month summary</p>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Clients</span>
                <span className="text-lg font-semibold text-foreground">{data.analytics.clients}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Projects</span>
                <span className="text-lg font-semibold text-foreground">{data.analytics.projects}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Content</span>
                <span className="text-lg font-semibold text-foreground">{data.analytics.content}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">AI Spend</span>
                <span className="text-lg font-semibold text-foreground">
                  ${data.analytics.aiSpend.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push('/dashboard/analytics')}
            >
              View Full Analytics
            </Button>
          </div>
        </WidgetCard>

        {/* 9. Archive Widget */}
        <WidgetCard
          title="Archive"
          icon={<Archive className="w-5 h-5" />}
          href="/dashboard/archive"
        >
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-foreground">{data.archive.total}</p>
              <p className="text-sm text-muted-foreground">archived items</p>
            </div>

            <p className="text-sm text-muted-foreground">
              Archived clients, projects, and content you've moved to storage
            </p>

            {data.archive.total > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push('/dashboard/archive')}
              >
                View Archive
              </Button>
            )}
          </div>
        </WidgetCard>
      </div>
    </div>
  )

  function formatTokens(tokens: number): string {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
    return tokens.toString()
  }
}
