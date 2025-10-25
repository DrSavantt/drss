'use client'

import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: string
  icon: LucideIcon
  color: 'mint' | 'coral' | 'amber'
}

const colorMap = {
  mint: '#4ECDC4',
  coral: '#FF6B6B',
  amber: '#FFE66D'
}

export function MetricCard({ title, value, subtitle, trend, icon: Icon, color }: MetricCardProps) {
  const accentColor = colorMap[color]
  
  return (
    <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 hover:border-[#4ECDC4]/50 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-xs text-gray-400 uppercase tracking-wide font-medium">{title}</h3>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="text-3xl font-bold text-white">{value}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
      </div>
      
      {trend && (
        <div className="text-xs" style={{ color: accentColor }}>
          {trend}
        </div>
      )}
    </div>
  )
}

