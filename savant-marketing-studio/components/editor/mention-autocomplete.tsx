'use client'

import { useEffect, useRef } from 'react'
import { MentionOption } from '@/lib/editor/types'
import { cn } from '@/lib/utils'

interface MentionAutocompleteProps {
  query: string
  onSelect: (mention: MentionOption) => void
  onClose: () => void
  isOpen: boolean
  selectedIndex?: number
  onNavigate?: (direction: 'up' | 'down') => void
}

export function MentionAutocomplete({
  query,
  onSelect,
  onClose,
  isOpen,
  selectedIndex = 0,
  onNavigate
}: MentionAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // Import filtered mentions
  const { filterMentions } = require('@/lib/editor/ai-commands')
  const mentions = filterMentions(query)

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selected) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, isOpen])

  if (!isOpen || mentions.length === 0) return null

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 z-50"
    >
      <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
        {mentions.map((mention: MentionOption, index: number) => (
          <button
            key={mention.id}
            data-index={index}
            onClick={() => onSelect(mention)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group',
              index === selectedIndex
                ? 'bg-red-primary/10 border border-red-primary/20'
                : 'hover:bg-muted/50 border border-transparent'
            )}
            tabIndex={0}
          >
            <div
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-lg',
                index === selectedIndex
                  ? 'bg-red-primary/20'
                  : 'bg-muted/50 group-hover:bg-muted'
              )}
            >
              {mention.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-semibold font-mono',
                    index === selectedIndex ? 'text-red-primary' : 'text-foreground'
                  )}
                >
                  {mention.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {mention.description}
              </div>
            </div>

            {index === selectedIndex && (
              <div className="text-xs text-red-primary/60 font-medium">
                ↵
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          ↑↓ Navigate • ↵ Select • ESC Close
        </p>
      </div>
    </div>
  )
}

