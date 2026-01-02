'use client'

import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { AnimatedButton } from '@/components/animated-button'

interface QuickActionButtonProps {
  icon: LucideIcon
  label: string
  href: string
  variant: 'primary' | 'secondary'
}

export function QuickActionButton({ icon: Icon, label, href, variant }: QuickActionButtonProps) {
  if (variant === 'primary') {
    return (
      <Link href={href}>
        <AnimatedButton variant="primary" className="flex items-center gap-2 h-10 px-5">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        </AnimatedButton>
      </Link>
    )
  }
  
  return (
    <Link href={href}>
      <AnimatedButton variant="secondary" className="flex items-center gap-2 h-10 px-5">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      </AnimatedButton>
    </Link>
  )
}
