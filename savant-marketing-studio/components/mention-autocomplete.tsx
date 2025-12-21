'use client'

import { useMemo } from 'react'
import { User, Folder, FileText } from 'lucide-react'

interface MentionItem {
  id: string
  name: string
  type: 'client' | 'project' | 'content'
  subType?: string
}

interface Props {
  items: MentionItem[]
  query: string
  onSelect: (item: MentionItem) => void
  onClose: () => void
}

export function MentionAutocomplete({ items, query, onSelect, onClose }: Props) {
  const filtered = useMemo(() => {
    return items
      .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
  }, [items, query])

  if (filtered.length === 0) return null

  function getIcon(type: string) {
    switch (type) {
      case 'client':
        return <User className="w-4 h-4 text-red-primary" />
      case 'project':
        return <Folder className="w-4 h-4 text-red-primary" />
      case 'content':
        return <FileText className="w-4 h-4 text-red-primary" />
      default:
        return <span className="text-red-primary">📌</span>
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="p-2 space-y-0.5">
        {filtered.map((item, index) => (
          <button
            key={`${item.type}-${item.id}`}
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-highlight rounded-lg transition-colors text-left group"
            tabIndex={0}
          >
            <div className="w-8 h-8 flex items-center justify-center bg-red-primary/10 rounded-lg group-hover:bg-red-primary/20 transition-colors">
              {getIcon(item.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {item.name}
              </div>
              <div className="text-xs text-silver/60 capitalize">
                {item.type === 'content' && item.subType ? item.subType : item.type}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="px-3 py-2 border-t border-border bg-surface-highlight/50">
        <p className="text-xs text-silver/60 text-center">
          {filtered.length} {filtered.length === 1 ? 'match' : 'matches'} • ESC to close
        </p>
      </div>
    </div>
  )
}

