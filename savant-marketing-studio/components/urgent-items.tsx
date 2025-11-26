import { AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface UrgentItem {
  id: string
  title: string
  subtitle?: string
  dueDate?: string
  href: string
  type: 'project' | 'client' | 'content'
}

interface UrgentItemsProps {
  items: UrgentItem[]
}

export function UrgentItems({ items }: UrgentItemsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="bg-charcoal rounded-xl p-6 border-2 border-red-primary/20">
      {/* Header with pulsing indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <div className="w-2 h-2 bg-warning rounded-full" />
          <div className="w-2 h-2 bg-warning rounded-full absolute top-0 left-0 animate-ping" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Needs Your Attention</h3>
        <span className="ml-auto text-sm font-medium text-red-primary">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Urgent items list */}
      <div className="space-y-3">
        {items.map(item => {
          const daysLeft = item.dueDate 
            ? Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between p-3 bg-dark-gray rounded-lg hover:bg-mid-gray cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {daysLeft !== null && daysLeft <= 1 ? (
                    <AlertCircle className="text-warning" size={20} />
                  ) : (
                    <Clock className="text-warning" size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-sm text-silver truncate">{item.subtitle}</p>
                  )}
                  {daysLeft !== null && (
                    <p className={`text-xs mt-0.5 ${
                      daysLeft <= 1 ? 'text-warning' : 'text-slate'
                    }`}>
                      Due {daysLeft <= 0 ? 'today' : `in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
                    </p>
                  )}
                </div>
              </div>
              <button className="px-4 py-2 bg-red-primary rounded-lg text-pure-white text-sm font-medium hover:bg-red-bright transition-colors opacity-0 group-hover:opacity-100">
                Handle Now
              </button>
            </Link>
          )
        })}
      </div>

      {/* Footer CTA */}
      <div className="mt-4 pt-4 border-t border-mid-gray">
        <Link 
          href="/dashboard/projects/board"
          className="text-sm text-silver hover:text-foreground transition-colors"
        >
          View all projects →
        </Link>
      </div>
    </div>
  )
}
