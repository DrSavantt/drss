'use client'

interface JournalBulkActionBarProps {
  selectedCount: number
  onDelete: () => void
  onPin: () => void
  onUnpin: () => void
  onAddTags: () => void
  onConvertToContent: () => void
  onCancel: () => void
  hasPinnedItems?: boolean
}

export function JournalBulkActionBar({
  selectedCount,
  onDelete,
  onPin,
  onUnpin,
  onAddTags,
  onConvertToContent,
  onCancel,
  hasPinnedItems = false
}: JournalBulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-charcoal border-t-2 border-red-primary shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Selection Count */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-primary rounded-full animate-pulse" />
            <p className="text-foreground font-semibold">
              {selectedCount} {selectedCount === 1 ? 'entry' : 'entries'} selected
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
            {/* Delete */}
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-md bg-red-primary text-white font-medium hover:bg-red-bright transition-colors flex items-center gap-2"
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
            </button>

            {/* Pin/Unpin */}
            {hasPinnedItems ? (
              <button
                onClick={onUnpin}
                className="px-4 py-2 rounded-md bg-dark-gray border border-mid-gray text-foreground font-medium hover:bg-mid-gray transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Unpin
              </button>
            ) : (
              <button
                onClick={onPin}
                className="px-4 py-2 rounded-md bg-success/20 border border-success text-success font-medium hover:bg-success/30 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                Pin
              </button>
            )}

            {/* Add Tags */}
            <button
              onClick={onAddTags}
              className="px-4 py-2 rounded-md bg-dark-gray border border-mid-gray text-foreground font-medium hover:bg-mid-gray transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Add Tags
            </button>

            {/* Convert to Content */}
            <button
              onClick={onConvertToContent}
              className="px-4 py-2 rounded-md bg-green-500/20 border border-green-500 text-green-600 font-medium hover:bg-green-500/30 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Convert to Content
            </button>

            {/* Cancel */}
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-mid-gray text-silver hover:text-foreground hover:bg-dark-gray transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
