'use client'

import { useState } from 'react'

interface MentionItem {
  id: string
  name: string
  type: 'client' | 'project' | 'content'
  subType?: string
}

interface Props {
  items: MentionItem[]
  onSelect: (item: MentionItem) => void
  onClose: () => void
  position: { top: number; left: number }
}

export function MentionModal({ items, onSelect, onClose, position }: Props) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'clients' | 'projects' | 'content'>('all')

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'clients') return matchesSearch && item.type === 'client'
    if (activeTab === 'projects') return matchesSearch && item.type === 'project'
    if (activeTab === 'content') return matchesSearch && item.type === 'content'
    return matchesSearch
  })

  function getIcon(type: string) {
    switch (type) {
      case 'client':
        return '👤'
      case 'project':
        return '📁'
      case 'content':
        return '📄'
      default:
        return '📌'
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50" 
      onClick={onClose}
    >
      <div
        className="absolute bg-charcoal rounded-lg shadow-2xl border border-mid-gray w-80 sm:w-96 max-h-96 overflow-hidden"
        style={{ 
          top: Math.min(position.top, window.innerHeight - 400), 
          left: Math.min(position.left, window.innerWidth - 400) 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="p-3 border-b border-mid-gray">
          <input
            type="text"
            placeholder="Search clients, projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-mid-gray bg-dark-gray rounded-lg focus:ring-2 focus:ring-red-primary focus:outline-none text-foreground placeholder-slate"
            autoFocus
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-mid-gray bg-dark-gray">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'all' 
                ? 'border-b-2 border-red-primary text-red-primary bg-charcoal' 
                : 'text-silver hover:text-foreground'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'clients' 
                ? 'border-b-2 border-red-primary text-red-primary bg-charcoal' 
                : 'text-silver hover:text-foreground'
            }`}
          >
            Clients
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'projects' 
                ? 'border-b-2 border-red-primary text-red-primary bg-charcoal' 
                : 'text-silver hover:text-foreground'
            }`}
          >
            Projects
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'content' 
                ? 'border-b-2 border-red-primary text-red-primary bg-charcoal' 
                : 'text-silver hover:text-foreground'
            }`}
          >
            Content
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-64">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate">
              No matches found
            </div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-dark-gray flex items-center gap-3 transition-colors border-b border-mid-gray last:border-0"
              >
                <span className="text-xl">{getIcon(item.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">{item.name}</div>
                  <div className="text-xs text-slate capitalize">
                    {item.type === 'content' && item.subType ? item.subType : item.type}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-2 border-t border-mid-gray bg-dark-gray text-xs text-slate text-center">
          Press ESC to close
        </div>
      </div>
    </div>
  )
}
