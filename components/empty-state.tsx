import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  cta: {
    label: string
    href: string
  }
}

export function EmptyState({ icon: Icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-6 bg-slate-900 rounded-xl border-2 border-dashed border-slate-700">
      <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="text-coral" size={32} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-sm mx-auto text-sm">
        {description}
      </p>
      <Link 
        href={cta.href}
        className="inline-flex items-center gap-2 px-6 py-3 bg-coral rounded-xl text-white font-medium hover:bg-coral-dark transition-all active:scale-95"
      >
        {cta.label}
      </Link>
    </div>
  )
}

