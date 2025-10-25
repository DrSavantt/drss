'use client'

import { useState } from 'react'

interface MentionItem {
  id: string
  name: string
  type: 'client' | 'project' | 'content'
}

interface Props {
  items: MentionItem[]
  onSelect: (item: MentionItem) => void
  onClose: () => void
  position: { top: number; left: number }
}

export function MentionModal({ items, onSelect, onClose, position }: Props) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'clients' | 'projects'>('all')

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'clients') return matchesSearch && item.type === 'client'
    if (activeTab === 'projects') return matchesSearch && item.type === 'project'
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
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 w-80 sm:w-96 max-h-96 overflow-hidden"
        style={{ 
          top: Math.min(position.top, window.innerHeight - 400), 
          left: Math.min(position.left, window.innerWidth - 400) 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Search clients, projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'all' 
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'clients' 
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Clients
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'projects' 
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Projects
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-64">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No matches found
            </div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-0"
              >
                <span className="text-xl">{getIcon(item.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{item.type}</div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
          Press ESC to close
        </div>
      </div>
    </div>
  )
}

