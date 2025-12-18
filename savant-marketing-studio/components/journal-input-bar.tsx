'use client'

import { Plus } from 'lucide-react'

interface JournalInputBarProps {
  onFocus: () => void
}

export function JournalInputBar({ onFocus }: JournalInputBarProps) {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm p-4 z-50"
      style={{
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
      }}
    >
      <button
        onClick={onFocus}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl hover:border-red-primary/50 transition-colors active:bg-surface-highlight"
      >
        <Plus className="w-5 h-5 text-red-primary flex-shrink-0" />
        <span className="text-silver text-left text-sm">
          Start typing to capture...
        </span>
      </button>
    </div>
  )
}

