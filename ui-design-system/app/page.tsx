import { AppShell } from "@/components/layout/app-shell"
import { StatCard } from "@/components/ui/stat-card"
import { Users, FolderKanban, FileText, Sparkles, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const stats = [
  { title: "Active Clients", value: 12, icon: Users, trend: { value: 8, isPositive: true } },
  { title: "Active Projects", value: 34, icon: FolderKanban, trend: { value: 12, isPositive: true } },
  { title: "Content Assets", value: 156, icon: FileText },
  { title: "AI Spend (MTD)", value: "$12.45", icon: Sparkles },
]

const recentActivity = [
  { action: "Email copy created", client: "Acme Corp", time: "2 min ago" },
  { action: "Project moved to Review", client: "TechStart", time: "15 min ago" },
  { action: "AI generated landing page", client: "Acme Corp", time: "1 hour ago" },
  { action: "New framework added", client: null, time: "2 hours ago" },
  { action: "Client onboarded", client: "NewCo Inc", time: "3 hours ago" },
]

const urgentProjects = [
  { name: "Black Friday Campaign", client: "Acme Corp", due: "Today", priority: "high" },
  { name: "Email Sequence", client: "TechStart", due: "Tomorrow", priority: "medium" },
  { name: "Landing Page Copy", client: "NewCo Inc", due: "Overdue", priority: "critical" },
]

const aiUsage = [
  { model: "Claude Sonnet 4", cost: 8.2, percentage: 66 },
  { model: "Claude Haiku 4", cost: 2.15, percentage: 17 },
  { model: "Claude Opus 4", cost: 1.5, percentage: 12 },
  { model: "Gemini Flash", cost: 0.6, percentage: 5 },
]

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Jay</h1>
          <p className="text-muted-foreground">{today}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
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
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      {activity.client && <p className="text-xs text-muted-foreground">{activity.client}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Urgent Projects */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Urgent Projects
              </CardTitle>
              <CardDescription>Projects requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {urgentProjects.map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <Badge
                      variant={
                        project.priority === "critical"
                          ? "destructive"
                          : project.priority === "high"
                            ? "default"
                            : "secondary"
                      }
                      className={
                        project.priority === "critical"
                          ? "bg-destructive text-destructive-foreground"
                          : project.priority === "high"
                            ? "bg-primary text-primary-foreground"
                            : ""
                      }
                    >
                      {project.due}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
    </AppShell>
  )
}
