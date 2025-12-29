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
    <div className="text-center py-12 px-6 bg-charcoal rounded-lg border-2 border-dashed border-mid-gray">
      <div className="w-16 h-16 bg-red-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="text-red-primary" size={32} />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-silver mb-6 max-w-sm mx-auto text-sm">
        {description}
      </p>
      <Link 
        href={cta.href}
        className="inline-flex items-center gap-2 px-6 py-3 bg-red-primary rounded-lg text-foreground font-medium hover:bg-red-dark transition-all active:scale-95 no-underline"
      >
        {cta.label}
      </Link>
    </div>
  )
}
