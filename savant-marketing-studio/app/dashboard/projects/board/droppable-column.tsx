'use client'

import { useDroppable } from '@dnd-kit/core'

interface DroppableColumnProps {
  id: string
  title: string
  count: number
  children: React.ReactNode
}

export function DroppableColumn({ id, title, count, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className="bg-charcoal border border-mid-gray rounded-t-lg px-4 py-3 border-b border-mid-gray">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <span className="text-xs font-medium text-slate">{count}</span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`flex-1 bg-dark-gray border-l border-r border-b border-mid-gray rounded-b-lg p-4 space-y-3 min-h-[500px] transition-colors ${
          isOver ? 'bg-charcoal border-dashed border-red-bright/50' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}
