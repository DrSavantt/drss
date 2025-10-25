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
      bg-slate-900 rounded-xl border border-slate-800 
      hover:border-coral/30 transition-all duration-300
      ${isHero ? 'p-8' : 'p-6'}
    `}>
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
          {label}
        </p>
        {icon && (
          <div className="text-slate-600">
            {icon}
          </div>
        )}
      </div>

      {/* Value with trend */}
      <div className="flex items-baseline gap-3 mb-2">
        <p className={`font-bold text-white ${isHero ? 'text-6xl' : 'text-5xl'}`}>
          {value}
        </p>
        
        {trend && (
          <div className={`flex items-center gap-1 ${
            trend.isPositive ? 'text-mint' : 'text-coral'
          }`}>
            {trend.isPositive ? (
              <ArrowUp size={16} />
            ) : (
              <ArrowDown size={16} />
            )}
            <span className="text-sm font-medium">
              {Math.abs(trend.value)}
              {trend.label && (
                <span className="text-slate-500 ml-1">{trend.label}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      {cta && (
        <Link 
          href={cta.href}
          className="inline-flex items-center gap-1 mt-4 text-sm text-coral hover:text-coral/80 font-medium transition-colors"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  )
}

