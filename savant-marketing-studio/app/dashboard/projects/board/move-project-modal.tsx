'use client'

import { useState } from 'react'
import { ResponsiveModal } from '@/components/responsive-modal'
import { updateProjectStatus } from '@/app/actions/projects'

interface Project {
  id: string
  name: string
  status: string
  clients: {
    name: string
  } | null
}

interface MoveProjectModalProps {
  project: Project
  onClose: () => void
  onMoved: (projectId: string, newStatus: string) => void
}

const columns = [
  { id: 'backlog', title: 'Backlog', icon: '📋', color: 'bg-slate' },
  { id: 'in_progress', title: 'In Progress', icon: '🔄', color: 'bg-info' },
  { id: 'in_review', title: 'In Review', icon: '👀', color: 'bg-warning' },
  { id: 'done', title: 'Done', icon: '✅', color: 'bg-success' },
]

export function MoveProjectModal({ project, onClose, onMoved }: MoveProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  async function handleMove(newStatus: string) {
    if (newStatus === project.status) {
      onClose()
      return
    }

    setSelectedStatus(newStatus)
    setLoading(true)

    try {
      await updateProjectStatus(project.id, newStatus, 0)
      
      // Haptic feedback on success
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 20, 30])
      }
      
      onMoved(project.id, newStatus)
      onClose()
    } catch (error) {
      console.error('Failed to move project:', error)
      setLoading(false)
      setSelectedStatus(null)
    }
  }

  return (
    <ResponsiveModal
      open={true}
      onOpenChange={(open) => { if (!open) onClose() }}
      title="Move Project"
      className="max-w-sm"
    >
      <div className="space-y-4">
        {/* Project Info */}
        <div className="bg-charcoal rounded-lg p-3 border border-mid-gray">
          <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
          <p className="text-xs text-silver mt-1">{project.clients?.name || 'Unknown Client'}</p>
        </div>

        {/* Status Options */}
        <div className="space-y-2">
          <p className="text-sm text-silver">Select destination:</p>
          <div className="grid grid-cols-1 gap-2">
            {columns.map((column) => {
              const isCurrentStatus = project.status === column.id
              const isSelected = selectedStatus === column.id
              
              return (
                <button
                  key={column.id}
                  onClick={() => handleMove(column.id)}
                  disabled={loading}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                    ${isCurrentStatus 
                      ? 'border-red-primary bg-red-primary/10 cursor-default' 
                      : isSelected
                        ? 'border-info bg-info/10'
                        : 'border-mid-gray bg-dark-gray hover:border-silver active:scale-[0.98]'
                    }
                    ${loading && !isSelected ? 'opacity-50' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  <span className="text-2xl">{column.icon}</span>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-foreground">{column.title}</span>
                    {isCurrentStatus && (
                      <span className="ml-2 text-xs text-red-primary">(current)</span>
                    )}
                  </div>
                  {isSelected && loading && (
                    <div className="w-5 h-5 border-2 border-info border-t-transparent rounded-full animate-spin" />
                  )}
                  {!isSelected && !isCurrentStatus && (
                    <svg className="w-5 h-5 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="w-full py-3 text-silver hover:text-foreground transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </ResponsiveModal>
  )
}
