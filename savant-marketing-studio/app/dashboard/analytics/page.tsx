'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { springTransitions } from '@/lib/animations'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { Users, CheckCircle2, FileText, Activity, TrendingUp, Folder } from 'lucide-react'

type TimeSeriesData = Array<{ date: string; value: number }>

interface StatsData {
  totalClients: number
  activeProjects: number
  totalContent: number
  journalEntries: number
  clientGrowth: number
  contentByType: Record<string, number>
  projectsByStatus: Record<string, number>
}

interface AnalyticsData {
  stats: StatsData
  clientGrowth: TimeSeriesData
  projectsCompleted: TimeSeriesData
  contentCreated: TimeSeriesData
  dailyActivity: TimeSeriesData
}

const TIME_PERIODS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 }
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?days=${period}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-silver">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-silver text-sm md:text-base">Historical trends and insights</p>
      </div>

      {/* Stat Cards */}
      {data?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
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
            icon={<Activity className="w-5 h-5" />}
            color="purple"
          />
        </div>
      )}

      {/* Time Period Selector - Scrollable on mobile */}
      <div className="flex gap-2 mb-6 md:mb-8 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {TIME_PERIODS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`px-4 py-2 rounded-lg transition-all min-h-[44px] whitespace-nowrap text-sm md:text-base ${
              period === value
                ? 'bg-red-primary text-white'
                : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-silver hover:text-foreground active:bg-surface-highlight'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Charts Grid - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ChartCard
          title="Client Growth"
          icon={<Users className="w-5 h-5" />}
          data={data?.clientGrowth || []}
          color="#ef4444"
          valueLabel="Total Clients"
        />
        
        <ChartCard
          title="Projects Completed"
          icon={<CheckCircle2 className="w-5 h-5" />}
          data={data?.projectsCompleted || []}
          color="#10b981"
          valueLabel="Completed"
        />
        
        <ChartCard
          title="Content Created"
          icon={<FileText className="w-5 h-5" />}
          data={data?.contentCreated || []}
          color="#3b82f6"
          valueLabel="Assets"
        />
        
        <ChartCard
          title="Daily Activity"
          icon={<Activity className="w-5 h-5" />}
          data={data?.dailyActivity || []}
          color="#8b5cf6"
          valueLabel="Actions"
        />
      </div>

      {/* Breakdown Charts */}
      {data?.stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
          <BreakdownCard
            title="Content by Type"
            icon={<FileText className="w-5 h-5" />}
            data={data.stats.contentByType}
            type="bar"
          />
          <BreakdownCard
            title="Projects by Status"
            icon={<CheckCircle2 className="w-5 h-5" />}
            data={data.stats.projectsByStatus}
            type="bar"
          />
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  trend,
  color
}: {
  title: string
  value: number
  icon: React.ReactNode
  trend?: number
  color: 'red' | 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    red: 'bg-red-primary/10 text-red-primary',
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.springMedium}
      className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 md:p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs md:text-sm font-medium ${
            trend >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            <TrendingUp className={`w-3 h-3 md:w-4 md:h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-xs md:text-sm text-silver">{title}</div>
      {trend !== undefined && (
        <div className="text-xs text-silver/60 mt-1">vs last month</div>
      )}
    </motion.div>
  )
}

function ChartCard({
  title,
  icon,
  data,
  color,
  valueLabel
}: {
  title: string
  icon: React.ReactNode
  data: TimeSeriesData
  color: string
  valueLabel: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.springMedium}
      className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="text-foreground flex-shrink-0">{icon}</div>
          <h3 className="text-base md:text-lg font-semibold text-foreground truncate">{title}</h3>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl md:text-2xl font-bold text-foreground">{total}</div>
          <div className="text-xs md:text-sm text-silver">{valueLabel}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border)" 
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--silver)', fontSize: 10 }}
            tickFormatter={(date) => {
              const d = new Date(date)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--silver)', fontSize: 10 }}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              fontSize: '12px'
            }}
            labelFormatter={(date) => {
              const d = new Date(date)
              return d.toLocaleDateString()
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

function BreakdownCard({
  title,
  icon,
  data,
  type
}: {
  title: string
  icon: React.ReactNode
  data: Record<string, number>
  type: 'bar' | 'pie'
}) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))

  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransitions.springMedium}
      className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 md:p-6 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="text-foreground">{icon}</div>
        <h3 className="text-base md:text-lg font-semibold text-foreground">{title}</h3>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-silver text-sm">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
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
      )}
    </motion.div>
  )
}
