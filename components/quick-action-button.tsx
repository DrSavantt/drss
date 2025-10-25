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
        className="bg-gradient-to-r from-[#4ECDC4] to-[#FF6B6B] text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </Link>
    )
  }
  
  return (
    <Link
      href={href}
      className="bg-[#1a1a1a] border border-gray-700 text-white px-5 py-2.5 rounded-lg hover:border-[#4ECDC4]/50 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  )
}

