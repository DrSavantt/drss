'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { SpotlightCard } from '@/components/ui/spotlight-card'

interface StatCardProps {
  label: string
  value: number | string
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  cta?: {
    label: string
    href: string
  }
  size?: 'default' | 'hero'
  icon?: React.ReactNode
}

export function StatCard({ label, value, trend, cta, size = 'default', icon }: StatCardProps) {
  const isHero = size === 'hero'
  
  return (
    <SpotlightCard className={`h-full flex flex-col ${isHero ? 'p-8' : 'p-6'}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-silver uppercase tracking-wide font-medium">
          {label}
        </p>
        {icon && (
          <div className="text-slate">
            {icon}
          </div>
        )}
      </div>

      {/* Value with trend */}
      <div className="flex items-baseline gap-3 mb-2 flex-1">
        <p className={`font-bold text-foreground ${isHero ? 'text-6xl' : 'text-5xl'}`}>
          {value}
        </p>
        
        {trend && (
          <div className={`flex items-center gap-1 ${
            trend.isPositive ? 'text-success' : 'text-red-primary'
          }`}>
            {trend.isPositive ? (
              <ArrowUp size={16} />
            ) : (
              <ArrowDown size={16} />
            )}
            <span className="text-sm font-medium">
              {Math.abs(trend.value)}
              {trend.label && (
                <span className="text-slate ml-1">{trend.label}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      {cta && (
        <Link 
          href={cta.href}
          className="inline-flex items-center gap-1 mt-4 text-sm text-red-primary hover:text-red-bright font-medium transition-colors"
        >
          {cta.label} →
        </Link>
      )}
    </SpotlightCard>
  )
}
