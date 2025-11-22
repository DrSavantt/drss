import { ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'

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
    <div className={`
      bg-card rounded-xl border border-card-border
      hover:border-accent-coral/30 transition-all duration-300
      ${isHero ? 'p-8' : 'p-6'}
    `}>
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </p>
        {icon && (
          <div className="text-muted">
            {icon}
          </div>
        )}
      </div>

      {/* Value with trend */}
      <div className="flex items-baseline gap-3 mb-2">
        <p className={`font-bold text-foreground ${isHero ? 'text-6xl' : 'text-5xl'}`}>
          {value}
        </p>

        {trend && (
          <div className={`flex items-center gap-1 ${
            trend.isPositive ? 'text-accent-mint' : 'text-accent-coral'
          }`}>
            {trend.isPositive ? (
              <ArrowUp size={16} />
            ) : (
              <ArrowDown size={16} />
            )}
            <span className="text-sm font-medium">
              {Math.abs(trend.value)}
              {trend.label && (
                <span className="text-muted-foreground ml-1">{trend.label}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1 mt-4 text-sm text-accent-coral hover:text-accent-coral/80 font-medium transition-colors"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  )
}
