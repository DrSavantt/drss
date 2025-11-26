'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface QuickActionButtonProps {
  icon: LucideIcon
  label: string
  href: string
  variant: 'primary' | 'secondary'
}

export function QuickActionButton({ icon: Icon, label, href, variant }: QuickActionButtonProps) {
  if (variant === 'primary') {
    return (
      <Link
        href={href}
        className="bg-red-primary text-pure-white px-5 py-2.5 rounded-lg hover:bg-red-bright transition-all duration-200 flex items-center gap-2 text-sm font-medium"
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </Link>
    )
  }
  
  return (
    <Link
      href={href}
      className="bg-charcoal border border-mid-gray text-foreground px-5 py-2.5 rounded-lg hover:border-red-bright/50 hover:bg-dark-gray transition-all duration-200 flex items-center gap-2 text-sm font-medium"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  )
}
