import { createClient } from '@/lib/supabase/server'

export default async function JournalPage() {
  const supabase = await createClient()
  
  if (!supabase) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Journal</h1>
        <p className="text-silver">Database connection not configured. Please set Supabase environment variables.</p>
      </div>
    )
  }
  
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Quick Capture Journal</h1>
        <p className="text-sm sm:text-base text-silver max-w-md mx-auto">
          Get ready for a powerful note-taking experience with @mentions, #tags, and smart organization.
        </p>
      </div>

      {/* Placeholder UI */}
      <div className="bg-charcoal rounded-lg border border-mid-gray shadow-sm p-8 text-center">
        <div className="text-6xl mb-6 animate-pulse">📝</div>
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Journal Feature Coming Soon
        </h2>
        <p className="text-silver mb-4 text-sm">
          We&apos;re building an intelligent journaling system that will revolutionize how you capture and organize ideas.
        </p>
        
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
          <div className="bg-info/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-info">{chats?.length || 0}</div>
            <div className="text-xs text-info">Chats</div>
          </div>
          <div className="bg-red-primary/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-primary">{entries?.length || 0}</div>
            <div className="text-xs text-red-primary">Entries</div>
          </div>
        </div>

        <div className="text-sm text-slate italic">
          Stay tuned for an epic note-taking experience! 🚀
        </div>
      </div>

      {/* Sneak Peek Features */}
      <div className="grid sm:grid-cols-3 gap-4 text-center">
        <div className="bg-charcoal p-4 rounded-lg border border-mid-gray">
          <div className="text-3xl mb-2">@</div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Smart Mentions</h3>
          <p className="text-xs text-silver">Link notes to clients and projects</p>
        </div>
        <div className="bg-charcoal p-4 rounded-lg border border-mid-gray">
          <div className="text-3xl mb-2">🏷️</div>
          <h3 className="text-sm font-semibold text-foreground mb-1">#Tags</h3>
          <p className="text-xs text-silver">Organize and find notes instantly</p>
        </div>
        <div className="bg-charcoal p-4 rounded-lg border border-mid-gray">
          <div className="text-3xl mb-2">🎤</div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Voice Notes</h3>
          <p className="text-xs text-silver">Capture ideas on the go</p>
        </div>
      </div>
    </div>
  )
}
