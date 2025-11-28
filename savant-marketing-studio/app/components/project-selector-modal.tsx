'use client'

import { useState } from 'react'

interface Project {
  id: string
  name: string
  clients: {
    name: string
  } | null
}

interface ProjectSelectorModalProps {
  isOpen: boolean
  projects: Project[]
  onSelect: (projectId: string | null) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ProjectSelectorModal({
  isOpen,
  projects,
  onSelect,
  onCancel,
  isLoading = false
}: ProjectSelectorModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.clients?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirm = () => {
    // If no project selected (empty string), pass null to remove project association
    onSelect(selectedProjectId || null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-pure-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 bg-charcoal rounded-lg border-2 border-mid-gray shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-mid-gray">
          <h3 className="text-xl font-bold text-foreground">Change Project</h3>
          <p className="mt-1 text-sm text-silver">
            Select a project to move the selected items to
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-mid-gray">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or clients..."
            className="w-full px-3 py-2 rounded-md border border-mid-gray bg-dark-gray text-foreground placeholder-slate focus:border-red-primary focus:outline-none focus:ring-1 focus:ring-red-primary"
          />
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Option to remove project */}
          <label
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
              selectedProjectId === ''
                ? 'border-red-primary bg-red-primary/10'
                : 'border-mid-gray hover:border-silver hover:bg-dark-gray'
            }`}
          >
            <input
              type="radio"
              name="project"
              value=""
              checked={selectedProjectId === ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mr-3 w-4 h-4 accent-red-primary"
            />
            <div>
              <p className="font-medium text-foreground">No Project</p>
              <p className="text-xs text-slate">Remove project association</p>
            </div>
          </label>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-silver">
              No projects found
            </div>
          ) : (
            filteredProjects.map((project) => (
              <label
                key={project.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedProjectId === project.id
                    ? 'border-red-primary bg-red-primary/10'
                    : 'border-mid-gray hover:border-silver hover:bg-dark-gray'
                }`}
              >
                <input
                  type="radio"
                  name="project"
                  value={project.id}
                  checked={selectedProjectId === project.id}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="mr-3 w-4 h-4 accent-red-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{project.name}</p>
                  {project.clients && (
                    <p className="text-xs text-slate mt-1">
                      Client: {project.clients.name}
                    </p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-mid-gray flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-md border border-mid-gray text-foreground hover:bg-dark-gray transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || selectedProjectId === null}
            className="px-4 py-2 rounded-md bg-red-primary text-white font-medium hover:bg-red-bright transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Moving...
              </span>
            ) : (
              'Move to Project'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
