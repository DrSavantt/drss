'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WidgetCardProps {
  title: string
  icon: React.ReactNode
  href: string
  children: React.ReactNode
  className?: string
}

export function WidgetCard({ title, icon, href, children, className }: WidgetCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden transition-all hover:border-border/80 h-[280px] flex flex-col',
        className
      )}
    >
      {/* Header - Clickable to navigate */}
      <Link
        href={href}
        className="flex items-center justify-between p-4 border-b border-border hover:bg-accent/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="text-red-primary">
            {icon}
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {title}
          </h3>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

