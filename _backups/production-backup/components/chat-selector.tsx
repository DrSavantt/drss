'use client'

interface Chat {
  id: string
  name: string
  type: string
  linked_id?: string | null
}

interface Props {
  chats: Chat[]
  selectedChatId: string
  onSelect: (chatId: string) => void
  onClose: () => void
}

export function ChatSelector({ chats, selectedChatId, onSelect, onClose }: Props) {
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-pure-black/80 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-charcoal rounded-lg shadow-xl border border-mid-gray w-full max-w-md max-h-[80vh] overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-mid-gray bg-dark-gray">
          <h3 className="font-semibold text-lg text-foreground">Capture to...</h3>
          <p className="text-xs text-slate mt-1">Choose where to save this entry</p>
        </div>
        
        <div className="p-2 overflow-y-auto max-h-[60vh]">
          {/* Inbox Section */}
          {inboxChats.length > 0 && (
            <>
              <div className="text-xs font-semibold text-slate px-3 py-2 uppercase tracking-wide">
                Defaults
              </div>
              {inboxChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-dark-gray rounded-md flex items-center justify-between transition-colors ${
                    chat.id === selectedChatId ? 'bg-red-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChatIcon(chat.type)}</span>
                    <span className="font-medium text-sm text-foreground">{chat.name}</span>
                  </div>
                  {chat.id === selectedChatId && <span className="text-red-primary font-bold">✓</span>}
                </button>
              ))}
            </>
          )}
          
          {/* Client Chats Section */}
          {clientChats.length > 0 && (
            <>
              <div className="text-xs font-semibold text-slate px-3 py-2 mt-3 uppercase tracking-wide">
                Client Chats
              </div>
              {clientChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-dark-gray rounded-md flex items-center justify-between transition-colors ${
                    chat.id === selectedChatId ? 'bg-red-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChatIcon(chat.type)}</span>
                    <span className="font-medium text-sm text-foreground">{chat.name}</span>
                  </div>
                  {chat.id === selectedChatId && <span className="text-red-primary font-bold">✓</span>}
                </button>
              ))}
            </>
          )}

          {/* Project Chats Section */}
          {projectChats.length > 0 && (
            <>
              <div className="text-xs font-semibold text-slate px-3 py-2 mt-3 uppercase tracking-wide">
                Project Chats
              </div>
              {projectChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-dark-gray rounded-md flex items-center justify-between transition-colors ${
                    chat.id === selectedChatId ? 'bg-red-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChatIcon(chat.type)}</span>
                    <span className="font-medium text-sm text-foreground">{chat.name}</span>
                  </div>
                  {chat.id === selectedChatId && <span className="text-red-primary font-bold">✓</span>}
                </button>
              ))}
            </>
          )}

          {/* General Chats Section */}
          {generalChats.length > 0 && (
            <>
              <div className="text-xs font-semibold text-slate px-3 py-2 mt-3 uppercase tracking-wide">
                Other Chats
              </div>
              {generalChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-dark-gray rounded-md flex items-center justify-between transition-colors ${
                    chat.id === selectedChatId ? 'bg-red-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChatIcon(chat.type)}</span>
                    <span className="font-medium text-sm text-foreground">{chat.name}</span>
                  </div>
                  {chat.id === selectedChatId && <span className="text-red-primary font-bold">✓</span>}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="p-3 border-t border-mid-gray bg-dark-gray flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-silver hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
