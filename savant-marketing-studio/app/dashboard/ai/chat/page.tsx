import { createClient } from '@/lib/supabase/server'
import { listConversations } from '@/app/actions/chat'
import { ChatInterface } from '@/components/ai-chat/chat-interface'

export const dynamic = 'force-dynamic'

export default async function AIChatPage() {
  const supabase = await createClient()
  
  if (!supabase) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Database connection unavailable</p>
      </div>
    )
  }

  // Fetch initial data in parallel - separate content types from writing frameworks
  const [clientsResult, contentTypesResult, writingFrameworksResult, modelsResult, conversationsResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('marketing_frameworks')
      .select('id, name, category')
      .eq('type', 'content-type')
      .order('name'),
    supabase
      .from('marketing_frameworks')
      .select('id, name, category')
      .eq('type', 'writing-framework')
      .order('name'),
    supabase
      .from('ai_models')
      .select('id, model_name, display_name')
      .eq('is_active', true)
      .order('display_name'),
    listConversations({ status: 'active' })
  ])

  return (
    <ChatInterface
      clients={clientsResult.data || []}
      contentTypes={contentTypesResult.data || []}
      writingFrameworks={writingFrameworksResult.data || []}
      models={modelsResult.data || []}
      initialConversations={conversationsResult.success ? conversationsResult.data || [] : []}
    />
  )
}
