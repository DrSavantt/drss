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
      <div className="bg-[#111111] border border-gray-800 rounded-t-lg px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">{title}</h2>
          <span className="text-xs font-medium text-gray-500">{count}</span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`flex-1 bg-[#111111] border-l border-r border-b border-gray-800 rounded-b-lg p-4 space-y-3 min-h-[500px] transition-colors ${
          isOver ? 'bg-[#1a1a1a] border-dashed border-[#4ECDC4]/50' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}
