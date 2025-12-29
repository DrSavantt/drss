'use client'

import { useState } from 'react'
import { ResponsiveModal } from '@/components/responsive-modal'
import { AnimatedButton } from '@/components/animated-button'

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

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.clients?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirm = () => {
    onSelect(selectedProjectId || null)
  }

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(val) => { if (!val) onCancel() }}
      title="Change Project"
      className="max-w-2xl"
    >
      <div className="space-y-4 max-h-[80vh] flex flex-col">
        <p className="text-sm text-silver">
            Select a project to move the selected items to
          </p>

        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or clients..."
            className="w-full px-3 py-2 rounded-md border border-mid-gray bg-dark-gray text-foreground placeholder-slate focus:border-red-primary focus:outline-none focus:ring-1 focus:ring-red-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
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

        <div className="flex gap-3 justify-end">
          <AnimatedButton
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="h-11 md:h-10 px-4"
          >
            Cancel
          </AnimatedButton>
          <AnimatedButton
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading || selectedProjectId === null}
            className="h-11 md:h-10 px-4"
          >
            {isLoading ? 'Moving...' : 'Move to Project'}
          </AnimatedButton>
        </div>
      </div>
    </ResponsiveModal>
  )
}
