'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { springTransitions } from '@/lib/animations'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, CheckCircle2, FileText, Activity } from 'lucide-react'

type TimeSeriesData = Array<{ date: string; value: number }>

interface AnalyticsData {
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
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-silver">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-silver">Historical trends and insights</p>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-8">
        {TIME_PERIODS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`px-4 py-2 rounded-lg transition-all ${
              period === value
                ? 'bg-red-primary text-white'
                : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-silver hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
    </div>
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
      className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-foreground">{icon}</div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{total}</div>
          <div className="text-sm text-silver">{valueLabel}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border)" 
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--silver)', fontSize: 12 }}
            tickFormatter={(date) => {
              const d = new Date(date)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
          />
          <YAxis
            tick={{ fill: 'var(--silver)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--foreground)'
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
