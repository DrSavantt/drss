'use client'

import { useState, useEffect } from 'react'
import { updateProjectStatus } from '@/app/actions/projects'
import { X } from 'lucide-react'

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
  const [isVisible, setIsVisible] = useState(false)

  // Animate in on mount
  useEffect(() => {
    setIsVisible(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [loading, onClose])

  async function handleMove(newStatus: string) {
    if (newStatus === project.status) {
      onClose()
      return
    }

    setSelectedStatus(newStatus)
    setLoading(true)

    try {
      await updateProjectStatus(project.id, newStatus, 0)
      
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
    <>
      {/* Backdrop with blur */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => !loading && onClose()}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className={`bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm transition-all duration-200 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Move Project</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-surface-highlight transition-colors"
            >
              <X className="w-5 h-5 text-silver" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
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
                            : 'border-mid-gray bg-dark-gray hover:border-silver active:bg-mid-gray'
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
          </div>
        </div>
      </div>
    </>
  )
}
