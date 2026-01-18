'use client'

import { AnimatedButton } from '@/components/animated-button'

interface BulkActionBarProps {
  selectedCount: number
  onDelete: () => void
  onArchive: () => void
  onUnarchive?: () => void
  onChangeProject: () => void
  onCancel: () => void
  hasArchivedItems?: boolean
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onArchive,
  onUnarchive,
  onChangeProject,
  onCancel,
  hasArchivedItems = false
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-charcoal border-t-2 border-red-primary shadow-2xl pb-safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex flex-row items-center justify-between gap-4">
          {/* Selection Count */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-primary rounded-full animate-pulse" />
            <p className="text-foreground font-semibold">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
            <AnimatedButton
              variant="primary"
              onClick={onDelete}
              className="h-10 px-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </AnimatedButton>

            {hasArchivedItems && onUnarchive ? (
              <AnimatedButton
                variant="secondary"
                onClick={onUnarchive}
                className="h-10 px-4 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Unarchive
              </AnimatedButton>
            ) : (
              <AnimatedButton
                variant="secondary"
              onClick={onArchive}
                className="h-10 px-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              Archive
              </AnimatedButton>
            )}

            <AnimatedButton
              variant="secondary"
              onClick={onChangeProject}
              className="h-10 px-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Change Project
            </AnimatedButton>

            <AnimatedButton
              variant="ghost"
              onClick={onCancel}
              className="h-10 px-4"
            >
              Cancel
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  )
}
