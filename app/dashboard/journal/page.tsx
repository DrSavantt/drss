import { createClient } from '@/lib/supabase/server'
import { JournalCapture } from '@/components/journal-capture'
import { JournalFeed } from '@/components/journal-feed'

export default async function JournalPage() {
  const supabase = await createClient()
  
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true })
  
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quick Capture</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Jot down ideas on the fly. @mention clients, #tag topics.
        </p>
      </div>

      <JournalCapture clients={clients || []} />
      
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Recent Entries</h2>
        <JournalFeed entries={entries || []} />
      </div>
    </div>
  )
}

