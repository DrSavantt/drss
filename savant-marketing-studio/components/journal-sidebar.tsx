'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Search, Filter } from 'lucide-react'

interface Chat {
  id: string
  name: string
  type: string
  linked_id?: string | null
}

interface Props {
  chats: Chat[]
  currentChatId: string
  onChatSelect: (chatId: string) => void
  entryCounts?: Record<string, number>
}

export function JournalSidebar({ chats, currentChatId, onChatSelect, entryCounts = {} }: Props) {
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['inbox', 'clients', 'projects', 'general'])
  )
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'inbox' | 'client' | 'project' | 'general'>('all')
  
  // Toggle section collapse
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }
  
  // Filter and search chats
  const filteredChats = useMemo(() => {
    let filtered = chats
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type === filterType)
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => c.name.toLowerCase().includes(query))
    }
    
    return filtered
  }, [chats, filterType, searchQuery])
  
  const inboxChats = filteredChats.filter(c => c.type === 'inbox')
  const clientChats = filteredChats.filter(c => c.type === 'client')
  const projectChats = filteredChats.filter(c => c.type === 'project')
  const generalChats = filteredChats.filter(c => c.type === 'general')

  function getChatIcon(type: string) {
    switch (type) {
      case 'inbox':
        return '📥'
      case 'client':
        return '👤'
      case 'project':
        return '📁'
      case 'general':
        return '💬'
      default:
        return '📌'
    }
  }

  function renderChatButton(chat: Chat) {
    const isActive = chat.id === currentChatId
    const count = entryCounts[chat.id] || 0

    return (
      <button
        key={chat.id}
        onClick={() => onChatSelect(chat.id)}
        className={`w-full px-3 py-2.5 rounded-md text-left transition-colors flex items-center justify-between group ${
          isActive
            ? 'bg-red-primary/20 text-red-primary font-medium'
            : 'text-silver hover:bg-dark-gray hover:text-foreground'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{getChatIcon(chat.type)}</span>
          <span className="text-sm truncate">{chat.name}</span>
        </div>
        {count > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
              isActive
                ? 'bg-red-primary text-white'
                : 'bg-mid-gray text-slate group-hover:bg-red-primary/20 group-hover:text-red-primary'
            }`}
          >
            {count}
          </span>
        )}
      </button>
    )
  }

  // Render collapsible section
  const renderSection = (title: string, sectionKey: string, chats: Chat[]) => {
    if (chats.length === 0) return null
    const isExpanded = expandedSections.has(sectionKey)
    
    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-dark-gray rounded-md transition-colors group"
        >
          <h3 className="text-xs font-semibold text-slate uppercase tracking-wide">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate">{chats.length}</span>
            {isExpanded ? (
              <ChevronDown size={14} className="text-slate" />
            ) : (
              <ChevronRight size={14} className="text-slate" />
            )}
          </div>
        </button>
        {isExpanded && (
          <div className="space-y-1 mt-1">
            {chats.map(chat => renderChatButton(chat))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full bg-charcoal border-r border-mid-gray flex flex-col">
      <div className="p-4 border-b border-mid-gray">
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wide mb-3">
          Quick Capture
        </h2>
        
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            type="text"
            placeholder="Search captures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-dark-gray border border-mid-gray rounded-md text-sm text-foreground placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-red-primary/50"
          />
        </div>
        
        {/* Filter Dropdown */}
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full pl-9 pr-3 py-2 bg-dark-gray border border-mid-gray rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-primary/50 appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="inbox">Inbox Only</option>
            <option value="client">Clients Only</option>
            <option value="project">Projects Only</option>
            <option value="general">General Only</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {filteredChats.length === 0 ? (
          <div className="text-center py-8 text-slate text-sm">
            {searchQuery ? 'No captures found' : 'No captures yet'}
          </div>
        ) : (
          <>
            {renderSection('Inbox', 'inbox', inboxChats)}
            {renderSection('Clients', 'clients', clientChats)}
            {renderSection('Projects', 'projects', projectChats)}
            {renderSection('Other', 'general', generalChats)}
          </>
        )}
      </div>
    </div>
  )
}
