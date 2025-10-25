import { createClient } from '@/lib/supabase/server'

export default async function JournalPage() {
  const supabase = await createClient()
  
  // Check if user has any journal chats
  const { data: chats, error: chatsError } = await supabase
    .from('journal_chats')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: entries, error: entriesError } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (chatsError) console.error('Chats fetch error:', chatsError)
  if (entriesError) console.error('Entries fetch error:', entriesError)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Quick Capture Journal</h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          Get ready for a powerful note-taking experience with @mentions, #tags, and smart organization.
        </p>
      </div>

      {/* Placeholder UI */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <div className="text-6xl mb-6 animate-pulse">📝</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Journal Feature Coming Soon
        </h2>
        <p className="text-gray-600 mb-4 text-sm">
          We&apos;re building an intelligent journaling system that will revolutionize how you capture and organize ideas.
        </p>
        
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{chats?.length || 0}</div>
            <div className="text-xs text-blue-800">Chats</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{entries?.length || 0}</div>
            <div className="text-xs text-purple-800">Entries</div>
          </div>
        </div>

        <div className="text-sm text-gray-500 italic">
          Stay tuned for an epic note-taking experience! 🚀
        </div>
      </div>

      {/* Sneak Peek Features */}
      <div className="grid sm:grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-3xl mb-2">@</div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Smart Mentions</h3>
          <p className="text-xs text-gray-600">Link notes to clients and projects</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-3xl mb-2">🏷️</div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">#Tags</h3>
          <p className="text-xs text-gray-600">Organize and find notes instantly</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-3xl mb-2">🎤</div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Voice Notes</h3>
          <p className="text-xs text-gray-600">Capture ideas on the go</p>
        </div>
      </div>
    </div>
  )
}
