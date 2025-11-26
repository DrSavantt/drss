'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Archive, FolderKanban, X } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onDelete: () => void
  onArchive: () => void
  onChangeProject: () => void
  onClear: () => void
  isLoading?: boolean
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onArchive,
  onChangeProject,
  onClear,
  isLoading = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-rich-black border-t border-mid-gray shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Count and clear */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{selectedCount}</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
                </span>
              </div>
              <button
                onClick={onClear}
                disabled={isLoading}
                className="text-sm text-silver hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              {/* Change Project */}
              <motion.button
                onClick={onChangeProject}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-dark-gray border border-mid-gray rounded-lg hover:bg-charcoal hover:border-red-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FolderKanban className="w-4 h-4" />
                <span className="hidden sm:inline">Change Project</span>
                <span className="sm:hidden">Project</span>
              </motion.button>

              {/* Archive */}
              <motion.button
                onClick={onArchive}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-dark-gray border border-mid-gray rounded-lg hover:bg-charcoal hover:border-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline">Archive</span>
              </motion.button>

              {/* Delete */}
              <motion.button
                onClick={onDelete}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-primary rounded-lg hover:bg-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
