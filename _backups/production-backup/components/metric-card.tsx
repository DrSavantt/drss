'use client'

import { LucideIcon } from 'lucide-react'
import { SpotlightCard } from '@/components/ui/spotlight-card'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: string
  icon: LucideIcon
  color: 'success' | 'primary' | 'warning'
}

// Semantic color mapping
const colorMap = {
  success: 'hsl(var(--success))',
  primary: 'hsl(var(--red-primary))',
  warning: 'hsl(var(--warning))'
}

export function MetricCard({ title, value, subtitle, trend, icon: Icon, color }: MetricCardProps) {
  const accentColor = colorMap[color]
  
  return (
    <SpotlightCard className="p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-xs text-silver uppercase tracking-wide font-medium">{title}</h3>
        </div>
      </div>
      
      <div className="mb-2 flex-1">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <div className="text-xs text-slate mt-1">{subtitle}</div>
        )}
      </div>
      
      {trend && (
        <div className="text-xs" style={{ color: accentColor }}>
          {trend}
        </div>
      )}
    </SpotlightCard>
  )
}
