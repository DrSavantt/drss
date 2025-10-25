import { createClient } from '@/lib/supabase/server'
import { JournalCapture } from '@/components/journal-capture'
import { JournalFeed } from '@/components/journal-feed'
import { getOrCreateInbox, getJournalChats, getJournalEntries } from '@/app/actions/journal'

export default async function JournalPage() {
  const supabase = await createClient()
  
  // Ensure user has an Inbox
  const defaultChatId = await getOrCreateInbox()
  
  // Fetch all data
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true })
  
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('name', { ascending: true })
  
  // Get all chats
  const chats = await getJournalChats()
  
  // Get all entries (not filtered by chat yet)
  const entries = await getJournalEntries()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quick Capture Journal</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Capture ideas instantly. @mention clients/projects. Organize into chats.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <div>
              <div className="text-sm font-medium text-blue-900">Chats</div>
              <div className="text-2xl font-bold text-blue-600">{chats.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <div>
              <div className="text-sm font-medium text-purple-900">Entries</div>
              <div className="text-2xl font-bold text-purple-600">{entries?.length || 0}</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">@</span>
            <div>
              <div className="text-sm font-medium text-green-900">Mentionables</div>
              <div className="text-2xl font-bold text-green-600">
                {(clients?.length || 0) + (projects?.length || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capture Form */}
      <JournalCapture 
        clients={clients || []} 
        projects={projects || []}
        chats={chats}
        defaultChatId={defaultChatId}
      />
      
      {/* Entries Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Entries</h2>
          <span className="text-sm text-gray-500">All Chats</span>
        </div>
        <JournalFeed entries={entries || []} />
      </div>

      {/* How to Use Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">📚 How to Use</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span><strong>Choose a Chat:</strong> Click the dropdown to select Inbox, a client chat, or project chat.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span><strong>Type Your Note:</strong> Write freely. Type <code className="bg-white px-1 rounded">@</code> to mention clients or projects.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span><strong>Mentions Auto-Link:</strong> @mentions create clickable links to clients/projects.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <span><strong>Voice Notes:</strong> 🎤 Coming soon - record voice memos on the go.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
