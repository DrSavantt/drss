'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springTransitions } from '@/lib/animations'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts'
import { 
  Users, CheckCircle2, FileText, Activity, TrendingUp, 
  Folder, AlertCircle, Archive, Zap, BookOpen, Percent,
  LayoutGrid, BarChart3, Clock, Hash, DollarSign, MessageSquare
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

type TimeSeriesData = Array<{ date: string; value: number }>

type TabId = 'overview' | 'clients' | 'projects' | 'content' | 'ai' | 'activity'
type TimePeriod = '7' | '30' | '90'
type ViewMode = 'cards' | 'charts'

interface StatsData {
  totalClients: number
  activeProjects: number
  totalContent: number
  journalEntries: number
  clientGrowth: number
  contentByType: Record<string, number>
  projectsByStatus: Record<string, number>
  archivedClients: number
  onboardingStatus: {
    not_started: number
    in_progress: number
    completed: number
  }
  completionRate: number
  totalProjects: number
  completedProjects: number
  overdueProjects: number
  projectsPerClient: number
  contentThisWeek: number
  aiGenerations: number
  totalTokens: number
  entriesThisWeek: number
  questionnairesCompleted: number
  totalAICost: number
  avgCostPerGeneration: number
}

interface AnalyticsData {
  stats: StatsData
  clientGrowth: TimeSeriesData
  projectsCompleted: TimeSeriesData
  contentCreated: TimeSeriesData
  dailyActivity: TimeSeriesData
  aiUsageTrend: TimeSeriesData
  aiByModel: Record<string, { count: number; cost: number; tokens: number }>
  aiByClient: Record<string, { count: number; cost: number; tokens: number; clientName: string }>
}

interface Client {
  id: string
  name: string
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'clients', label: 'Clients' },
  { id: 'projects', label: 'Projects' },
  { id: 'content', label: 'Content' },
  { id: 'ai', label: 'AI' },
  { id: 'activity', label: 'Activity' },
]

const CHART_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
  return tokens.toString()
}

function formatCurrency(amount: number): string {
  if (amount < 0.01) return '$0.00'
  return `$${amount.toFixed(2)}`
}

// Estimate cost at ~$0.002 per 1000 tokens (rough average)
function estimateCost(tokens: number): number {
  return (tokens / 1000) * 0.002
}

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: number
  color?: 'red' | 'blue' | 'green' | 'purple' | 'yellow' | 'default'
  alert?: boolean
}

function StatCard({ title, value, icon, trend, color = 'default', alert = false }: StatCardProps) {
  const colorClasses = {
    red: 'bg-red-500/10 text-red-500',
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    default: 'bg-muted text-muted-foreground'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.springMedium}
      className={cn(
        "bg-[var(--glass-bg)] border rounded-xl p-4 md:p-5 backdrop-blur-xl",
        alert ? "border-red-500" : "border-[var(--glass-border)]"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2.5 rounded-lg", colorClasses[color])}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={cn(
            "text-xs font-medium flex items-center gap-1",
            trend >= 0 ? "text-green-500" : "text-red-500"
          )}>
            <TrendingUp className={cn("w-3 h-3", trend < 0 && "rotate-180")} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-silver mt-1">{title}</p>
    </motion.div>
  )
}

// ============================================
// QUICK INSIGHTS COMPONENT
// ============================================

interface Insight {
  text: string
  type: 'warning' | 'success' | 'info'
}

function QuickInsights({ data }: { data: StatsData }) {
  const insights: Insight[] = []

  if (data.overdueProjects > 0) {
    insights.push({
      text: `${data.overdueProjects} overdue project${data.overdueProjects !== 1 ? 's' : ''} need attention`,
      type: 'warning'
    })
  }

  insights.push({
    text: `${data.contentThisWeek} content piece${data.contentThisWeek !== 1 ? 's' : ''} created this week`,
    type: 'info'
  })

  insights.push({
    text: `${data.completionRate}% onboarding completion rate`,
    type: data.completionRate < 50 ? 'warning' : 'success'
  })

  if (data.onboardingStatus.in_progress > 0) {
    insights.push({
      text: `${data.onboardingStatus.in_progress} client${data.onboardingStatus.in_progress !== 1 ? 's' : ''} currently onboarding`,
      type: 'info'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.springMedium}
      className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-5 backdrop-blur-xl"
    >
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-red-500" />
        Quick Insights
      </h3>
      <ul className="space-y-2.5">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            <span className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              insight.type === 'warning' && "bg-yellow-500",
              insight.type === 'success' && "bg-green-500",
              insight.type === 'info' && "bg-blue-500"
            )} />
            <span className="text-silver">{insight.text}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

// ============================================
// CHART CARD COMPONENT
// ============================================

interface ChartCardProps {
  title: string
  icon: React.ReactNode
  data: TimeSeriesData
  color: string
  valueLabel?: string
}

function LineChartCard({ title, icon, data, color, valueLabel }: ChartCardProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.springMedium}
      className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-foreground flex-shrink-0">{icon}</div>
          <h3 className="text-base font-semibold text-foreground truncate">{title}</h3>
        </div>
        {valueLabel && (
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold text-foreground">{total}</div>
            <div className="text-xs text-silver">{valueLabel}</div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--silver)', fontSize: 10 }}
            tickFormatter={(date) => {
              const d = new Date(date)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fill: 'var(--silver)', fontSize: 10 }} width={30} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              fontSize: '12px'
            }}
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

interface BarChartCardProps {
  title: string
  icon: React.ReactNode
  data: Record<string, number>
}

function BarChartCard({ title, icon, data }: BarChartCardProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    value
  }))

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransitions.springMedium}
        className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-5 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="text-foreground">{icon}</div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        <div className="h-[180px] flex items-center justify-center text-silver text-sm">
          No data available
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.springMedium}
      className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-5 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="text-foreground">{icon}</div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--silver)', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: 'var(--silver)', fontSize: 10 }} width={30} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

// ============================================
// TAB CONTENT COMPONENTS
// ============================================

interface TabContentProps {
  data: AnalyticsData
  viewMode: ViewMode
}

function OverviewTab({ data, viewMode }: TabContentProps) {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={data.stats.totalClients}
          icon={<Users className="w-5 h-5" />}
          trend={data.stats.clientGrowth}
          color="red"
        />
        <StatCard
          title="Active Projects"
          value={data.stats.activeProjects}
          icon={<Folder className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Content Pieces"
          value={data.stats.totalContent}
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Journal Entries"
          value={data.stats.journalEntries}
          icon={<BookOpen className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Quick Insights */}
      <QuickInsights data={data.stats} />

      {/* Charts - Only in charts view */}
      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LineChartCard
            title="Client Growth"
            icon={<Users className="w-5 h-5" />}
            data={data.clientGrowth}
            color="#ef4444"
            valueLabel="Total"
          />
          <LineChartCard
            title="Daily Activity"
            icon={<Activity className="w-5 h-5" />}
            data={data.dailyActivity}
            color="#8b5cf6"
            valueLabel="Actions"
          />
        </div>
      )}
    </div>
  )
}

function ClientsTab({ data, viewMode }: TabContentProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={data.stats.totalClients}
          icon={<Users className="w-5 h-5" />}
          trend={data.stats.clientGrowth}
          color="red"
        />
        <StatCard
          title="Archived Clients"
          value={data.stats.archivedClients}
          icon={<Archive className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Onboarded"
          value={data.stats.onboardingStatus.completed}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Completion Rate"
          value={`${data.stats.completionRate}%`}
          icon={<Percent className="w-5 h-5" />}
          color={data.stats.completionRate >= 50 ? 'green' : 'yellow'}
        />
      </div>

      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LineChartCard
            title="Client Growth Over Time"
            icon={<TrendingUp className="w-5 h-5" />}
            data={data.clientGrowth}
            color="#ef4444"
          />
          <BarChartCard
            title="Onboarding Funnel"
            icon={<Users className="w-5 h-5" />}
            data={{
              'Not Started': data.stats.onboardingStatus.not_started,
              'In Progress': data.stats.onboardingStatus.in_progress,
              'Completed': data.stats.onboardingStatus.completed
            }}
          />
        </div>
      )}
    </div>
  )
}

function ProjectsTab({ data, viewMode }: TabContentProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={data.stats.totalProjects}
          icon={<Folder className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Active"
          value={data.stats.activeProjects}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={data.stats.completedProjects}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Overdue"
          value={data.stats.overdueProjects}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
          alert={data.stats.overdueProjects > 0}
        />
      </div>

      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartCard
            title="Projects by Status"
            icon={<CheckCircle2 className="w-5 h-5" />}
            data={data.stats.projectsByStatus}
          />
          <LineChartCard
            title="Projects Completed Over Time"
            icon={<TrendingUp className="w-5 h-5" />}
            data={data.projectsCompleted}
            color="#10b981"
            valueLabel="Completed"
          />
        </div>
      )}
    </div>
  )
}

function ContentTab({ data, viewMode }: TabContentProps) {
  const totalContent = data.stats.totalContent
  const clientCount = data.stats.totalClients
  const perClient = clientCount > 0 ? Math.round((totalContent / clientCount) * 10) / 10 : 0
  
  // Find most used type
  const mostUsedType = Object.entries(data.stats.contentByType)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Content"
          value={totalContent}
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Created This Week"
          value={data.stats.contentThisWeek}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Per Client (avg)"
          value={perClient}
          icon={<Hash className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Most Used Type"
          value={mostUsedType.charAt(0).toUpperCase() + mostUsedType.slice(1)}
          icon={<FileText className="w-5 h-5" />}
          color="red"
        />
      </div>

      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartCard
            title="Content by Type"
            icon={<FileText className="w-5 h-5" />}
            data={data.stats.contentByType}
          />
          <LineChartCard
            title="Content Created Over Time"
            icon={<TrendingUp className="w-5 h-5" />}
            data={data.contentCreated}
            color="#3b82f6"
            valueLabel="Assets"
          />
        </div>
      )}
    </div>
  )
}

function AITab({ data, viewMode }: TabContentProps) {
  const avgTokens = data.stats.aiGenerations > 0 
    ? Math.round(data.stats.totalTokens / data.stats.aiGenerations) 
    : 0

  // Prepare chart data for models
  const modelChartData = Object.entries(data.aiByModel || {}).map(([modelId, modelData]) => ({
    name: modelId.includes('claude-sonnet') ? 'Sonnet 4.5' :
          modelId.includes('claude-opus') ? 'Opus 4.5' :
          modelId.includes('claude-haiku') ? 'Haiku 4.5' :
          modelId.includes('gemini-flash') ? 'Gemini Flash' :
          modelId.includes('gemini-pro') ? 'Gemini Pro' :
          modelId,
    value: modelData.count,
    cost: modelData.cost,
    tokens: modelData.tokens
  })).sort((a, b) => b.value - a.value)

  // Prepare chart data for clients
  const clientChartData = Object.entries(data.aiByClient || {})
    .map(([clientId, clientData]) => ({
      name: clientData.clientName || 'Unknown',
      value: clientData.count,
      cost: clientData.cost,
      tokens: clientData.tokens
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10 clients

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Generations"
          value={data.stats.aiGenerations}
          icon={<Zap className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Tokens Used"
          value={formatTokens(data.stats.totalTokens)}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Total Cost"
          value={formatCurrency(data.stats.totalAICost || 0)}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Avg Cost/Gen"
          value={formatCurrency(data.stats.avgCostPerGeneration || 0)}
          icon={<Hash className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Usage Trend */}
          <LineChartCard
            title="AI Usage Over Time"
            icon={<Zap className="w-5 h-5" />}
            data={data.aiUsageTrend || []}
            color="#8b5cf6"
          />
          
          {/* Spend by Model */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransitions.springMedium}
            className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <BarChart3 className="w-5 h-5 text-foreground" />
              <h3 className="text-base font-semibold text-foreground">Usage by Model</h3>
            </div>
            {modelChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={modelChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${percent ? (percent * 100).toFixed(0) : 0}%)`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {modelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-foreground">{data.name}</p>
                            <p className="text-sm text-muted-foreground">Generations: {data.value}</p>
                            <p className="text-sm text-muted-foreground">Cost: {formatCurrency(data.cost)}</p>
                            <p className="text-sm text-muted-foreground">Tokens: {formatTokens(data.tokens)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-silver text-sm">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No AI usage data yet</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Usage by Client */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransitions.springMedium}
            className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <Users className="w-5 h-5 text-foreground" />
              <h3 className="text-base font-semibold text-foreground">Usage by Client</h3>
            </div>
            {clientChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={clientChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-foreground">{data.name}</p>
                            <p className="text-sm text-muted-foreground">Generations: {data.value}</p>
                            <p className="text-sm text-muted-foreground">Cost: {formatCurrency(data.cost)}</p>
                            <p className="text-sm text-muted-foreground">Tokens: {formatTokens(data.tokens)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-silver text-sm">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No client usage data yet</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Model Cost Breakdown Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransitions.springMedium}
            className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-5 backdrop-blur-xl lg:col-span-2"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <DollarSign className="w-5 h-5 text-foreground" />
              <h3 className="text-base font-semibold text-foreground">Cost Breakdown by Model</h3>
            </div>
            {modelChartData.length > 0 ? (
              <div className="space-y-2">
                {modelChartData.map((model, index) => {
                  const percentage = data.stats.totalAICost > 0 
                    ? (model.cost / data.stats.totalAICost * 100).toFixed(1) 
                    : 0
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{model.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(model.cost)} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {model.value} generations
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTokens(model.tokens)} tokens
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-silver text-sm">
                <div className="text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No cost data yet</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

function ActivityTab({ data, viewMode }: TabContentProps) {
  const dailyAvg = data.stats.journalEntries > 0 && data.dailyActivity.length > 0
    ? Math.round((data.dailyActivity.reduce((sum, d) => sum + d.value, 0) / data.dailyActivity.length) * 10) / 10
    : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Journal Entries"
          value={data.stats.journalEntries}
          icon={<BookOpen className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Entries This Week"
          value={data.stats.entriesThisWeek}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Journal Chats"
          value={0}
          icon={<MessageSquare className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Avg Entries/Day"
          value={dailyAvg}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LineChartCard
            title="Daily Activity Trend"
            icon={<Activity className="w-5 h-5" />}
            data={data.dailyActivity}
            color="#8b5cf6"
            valueLabel="Actions"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransitions.springMedium}
            className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <BarChart3 className="w-5 h-5 text-foreground" />
              <h3 className="text-base font-semibold text-foreground">Activity by Type</h3>
            </div>
            <div className="h-[180px] flex items-center justify-center text-silver text-sm">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Type breakdown coming soon</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function AnalyticsPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch clients for dropdown
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/clients')
        const json = await res.json()
        if (Array.isArray(json)) {
          setClients(json.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      }
    }
    fetchClients()
  }, [])

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days: timePeriod })
      if (selectedClient !== 'all') {
        params.set('clientId', selectedClient)
      }
      const res = await fetch(`/api/analytics?${params}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [timePeriod, selectedClient])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-silver">Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-silver text-sm md:text-base mt-1">Historical trends and insights</p>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Client Dropdown */}
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[180px] md:w-[200px] bg-[var(--glass-bg)] border-[var(--glass-border)]">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time Period Pills */}
        <div className="flex gap-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg p-1">
          {(['7', '30', '90'] as TimePeriod[]).map(d => (
            <button
              key={d}
              onClick={() => setTimePeriod(d)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-all font-medium",
                timePeriod === d
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-silver hover:text-foreground hover:bg-[var(--glass-border)]"
              )}
            >
              {d} Days
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              "p-2 rounded-md transition-all",
              viewMode === 'cards'
                ? "bg-background shadow-sm text-foreground"
                : "text-silver hover:text-foreground"
            )}
            title="Cards view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('charts')}
            className={cn(
              "p-2 rounded-md transition-all",
              viewMode === 'charts'
                ? "bg-background shadow-sm text-foreground"
                : "text-silver hover:text-foreground"
            )}
            title="Charts view"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[var(--glass-border)] mb-6 overflow-x-auto">
        <nav className="flex gap-1 md:gap-6 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 px-2 text-sm font-medium transition-colors relative whitespace-nowrap",
                activeTab === tab.id
                  ? "text-red-500"
                  : "text-silver hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading overlay for data refresh */}
      {loading && data && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-2 rounded-lg backdrop-blur-xl">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-silver">Updating...</span>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {data && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewTab data={data} viewMode={viewMode} />}
            {activeTab === 'clients' && <ClientsTab data={data} viewMode={viewMode} />}
            {activeTab === 'projects' && <ProjectsTab data={data} viewMode={viewMode} />}
            {activeTab === 'content' && <ContentTab data={data} viewMode={viewMode} />}
            {activeTab === 'ai' && <AITab data={data} viewMode={viewMode} />}
            {activeTab === 'activity' && <ActivityTab data={data} viewMode={viewMode} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
