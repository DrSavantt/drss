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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-900">Capture to...</h3>
          <p className="text-xs text-gray-500 mt-1">Choose where to save this entry</p>
        </div>
        
        <div className="p-2 overflow-y-auto max-h-[60vh]">
          {/* Inbox Section */}
          {inboxChats.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide">
                Defaults
              </div>
              {inboxChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-gray-100 rounded-md flex items-center justify-between transition-colors ${
                    chat.id === selectedChatId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChatIcon(chat.type)}</span>
                    <span className="font-medium text-sm">{chat.name}</span>
                  </div>
                  {chat.id === selectedChatId && <span className="text-blue-600 font-bold">✓</span>}
                </button>
              ))}
            </>
          )}
          
          {/* Client Chats Section */}
          {clientChats.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 mt-3 uppercase tracking-wide">
                Client Chats
              </div>
              {clientChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-gray-100 rounded-md flex items-center justify-between transition-colors ${
                    chat.id === selectedChatId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChatIcon(chat.type)}</span>
                    <span className="font-medium text-sm">{chat.name}</span>
                  </div>
                  {chat.id === selectedChatId && <span className="text-blue-600 font-bold">✓</span>}
                </button>
              ))}
            </>
          )}

          {/* Project Chats Section */}
          {projectChats.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 mt-3 uppercase tracking-wide">
                Project Chats
              </div>
              {projectChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-gray-100 rounded-md flex items-center justify-between transition-colors ${
                    chat.id === selectedChatId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChatIcon(chat.type)}</span>
                    <span className="font-medium text-sm">{chat.name}</span>
                  </div>
                  {chat.id === selectedChatId && <span className="text-blue-600 font-bold">✓</span>}
                </button>
              ))}
            </>
          )}

          {/* General Chats Section */}
          {generalChats.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 mt-3 uppercase tracking-wide">
                Other Chats
              </div>
              {generalChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelect(chat.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-gray-100 rounded-md flex items-center justify-between transition-colors ${
                    chat.id === selectedChatId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChatIcon(chat.type)}</span>
                    <span className="font-medium text-sm">{chat.name}</span>
                  </div>
                  {chat.id === selectedChatId && <span className="text-blue-600 font-bold">✓</span>}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="p-3 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

