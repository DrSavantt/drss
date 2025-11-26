'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { X, FolderKanban } from 'lucide-react'
import { getClientName } from '@/lib/supabase/types'

interface Project {
  id: string
  name: string
  clients: {
    name: string
  } | null
}

interface ProjectSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (projectId: string | null) => void
  projects: Project[]
  isLoading?: boolean
}

export function ProjectSelectorModal({
  isOpen,
  onClose,
  onConfirm,
  projects,
  isLoading = false,
}: ProjectSelectorModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  const handleConfirm = () => {
    onConfirm(selectedProjectId)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={handleOverlayClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-rich-black border border-mid-gray rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-mid-gray">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-primary/20 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-red-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Change Project</h3>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-silver hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-silver mb-4">
              Select a project to assign to the selected items, or choose &quot;No Project&quot; to remove project assignment.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {/* No Project Option */}
              <button
                onClick={() => setSelectedProjectId(null)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedProjectId === null
                    ? 'border-red-primary bg-red-primary/10'
                    : 'border-mid-gray bg-dark-gray hover:border-red-primary/50'
                }`}
              >
                <div className="font-medium text-foreground">No Project</div>
                <div className="text-sm text-silver mt-1">Remove project assignment</div>
              </button>

              {/* Project List */}
              {projects.length === 0 ? (
                <div className="text-center py-8 text-silver">
                  No projects available
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedProjectId === project.id
                        ? 'border-red-primary bg-red-primary/10'
                        : 'border-mid-gray bg-dark-gray hover:border-red-primary/50'
                    }`}
                  >
                    <div className="font-medium text-foreground">{project.name}</div>
                    {getClientName(project.clients) && (
                      <div className="text-sm text-silver mt-1">
                        Client: {getClientName(project.clients)}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 bg-charcoal border-t border-mid-gray">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-silver hover:text-foreground border border-mid-gray rounded-lg hover:bg-dark-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-red-primary text-white rounded-lg hover:bg-red-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Project'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
