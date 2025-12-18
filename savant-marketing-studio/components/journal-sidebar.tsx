'use client'

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
  const inboxChats = chats.filter(c => c.type === 'inbox')
  const clientChats = chats.filter(c => c.type === 'client')
  const projectChats = chats.filter(c => c.type === 'project')
  const generalChats = chats.filter(c => c.type === 'general')

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

  return (
    <div className="h-full bg-charcoal border-r border-mid-gray overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-slate uppercase tracking-wide mb-3">
          Quick Capture
        </h2>

        {/* Inbox */}
        {inboxChats.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2 px-3">
              Inbox
            </h3>
            <div className="space-y-1">
              {inboxChats.map(chat => renderChatButton(chat))}
            </div>
          </div>
        )}

        {/* Client Chats */}
        {clientChats.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2 px-3">
              Clients
            </h3>
            <div className="space-y-1">
              {clientChats.map(chat => renderChatButton(chat))}
            </div>
          </div>
        )}

        {/* Project Chats */}
        {projectChats.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2 px-3">
              Projects
            </h3>
            <div className="space-y-1">
              {projectChats.map(chat => renderChatButton(chat))}
            </div>
          </div>
        )}

        {/* General Chats */}
        {generalChats.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2 px-3">
              Other
            </h3>
            <div className="space-y-1">
              {generalChats.map(chat => renderChatButton(chat))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
