'use client'

import { useDroppable } from '@dnd-kit/core'

interface DroppableColumnProps {
  id: string
  title: string
  color: string
  count: number
  children: React.ReactNode
}

export function DroppableColumn({ id, title, color, count, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className={`${color} rounded-t-lg px-4 py-3 border-b-2 border-gray-300`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <span className="text-sm font-medium text-gray-600">{count}</span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-lg p-4 space-y-3 min-h-[500px] transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : 'bg-gray-50'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
