'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WidgetCardProps {
  title: string
  icon: React.ReactNode
  href: string
  children: React.ReactNode
  className?: string
  index?: number
}

export function WidgetCard({ title, icon, href, children, className, index = 0 }: WidgetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
    >
      <Link href={href} className="block h-full">
        <div
          className={cn(
            'h-[280px] bg-card border border-border rounded-xl overflow-hidden',
            'transition-all duration-200 ease-out',
            'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20',
            'hover:border-border/60',
            'cursor-pointer group',
            'flex flex-col',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-muted-foreground transition-all duration-200',
                'group-hover:text-red-500 group-hover:scale-110'
              )}>
                {icon}
              </span>
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
            </div>
            <ArrowRight className={cn(
              'w-4 h-4 text-muted-foreground',
              'transition-all duration-200',
              'group-hover:translate-x-1 group-hover:text-foreground'
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
            {children}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

