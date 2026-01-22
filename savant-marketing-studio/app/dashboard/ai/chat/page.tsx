import { createClient } from '@/lib/supabase/server'
import { listConversations } from '@/app/actions/chat'
import { getContentAssets } from '@/app/actions/content'
import { getProjects } from '@/app/actions/projects'
import { ChatInterface } from '@/components/ai-chat/chat-interface'
import { getContentTypeLabel } from '@/lib/content-types'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ conversation?: string }>
}

function extractContentText(content: { content_json?: unknown; title?: string | null }): string | null {
  const contentJson = content.content_json
  if (!contentJson) return null

  if (typeof contentJson === 'string') return contentJson

  if (typeof contentJson === 'object' && contentJson !== null) {
    const collectText = (node: unknown): string => {
      if (typeof node === 'string') return node
      if (Array.isArray(node)) return node.map(collectText).filter(Boolean).join(' ')
      if (typeof node === 'object' && node !== null) {
        const record = node as Record<string, unknown>
        const text = typeof record.text === 'string' ? record.text : ''
        const childText = record.content ? collectText(record.content) : ''
        return [text, childText].filter(Boolean).join(' ')
      }
      return ''
    }

    const extracted = collectText(contentJson).replace(/\s+/g, ' ').trim()
    if (extracted) return extracted

    const stringified = JSON.stringify(contentJson)
    if (stringified.length > 2) return stringified
  }

  return content.title || null
}

export default async function AIChatPage({ searchParams }: PageProps) {
  const params = await searchParams
  const initialConversationId = params.conversation || null
  
  const supabase = await createClient()
  
  if (!supabase) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Database connection unavailable</p>
      </div>
    )
  }

  // Fetch initial data in parallel
  const [
    clientsResult,
    writingFrameworksResult,
    modelsResult,
    conversationsResult,
    projectsResult,
    journalEntriesResult,
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('marketing_frameworks')
      .select('id, name, category')
      .eq('type', 'writing-framework')
      .order('name'),
    supabase
      .from('ai_models')
      .select('id, model_name, display_name, max_tokens')
      .eq('is_active', true)
      .order('display_name'),
    listConversations({ status: 'active' }),
    getProjects(),
    // Fetch journal entries with mention arrays
    supabase
      .from('journal_entries')
      .select('id, title, icon, content, tags, mentioned_clients, mentioned_projects, mentioned_content, created_at, parent_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const clients = clientsResult.data || []
  const contentAssetsByClient = await Promise.all(
    clients.map(async (client) => ({
      clientId: client.id,
      clientName: client.name,
      assets: await getContentAssets(client.id),
    }))
  )

  const contentAssets = contentAssetsByClient.flatMap(({ clientId, clientName, assets }) =>
    (assets || []).map((asset) => ({
      id: asset.id,
      title: asset.title,
      content: extractContentText(asset),
      contentType: asset.asset_type ? getContentTypeLabel(asset.asset_type) : null,
      clientId,
      clientName,
    }))
  )

  const projects = (projectsResult || []).map((project) => {
    // Handle Supabase join result - clients can be an object or array
    const clientsData = project.clients as { name: string } | { name: string }[] | null
    let clientName: string | null = null
    if (clientsData) {
      if (Array.isArray(clientsData)) {
        clientName = clientsData[0]?.name ?? null
      } else {
        clientName = clientsData.name ?? null
      }
    }
    return {
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      clientId: project.client_id ?? null,
      clientName,
    }
  })

  // Build lookup maps for resolving UUIDs to names
  const clientMap = new Map(clients.map(c => [c.id, c.name]))
  const projectMap = new Map(projects.map(p => [p.id, p.name]))
  const contentMap = new Map(contentAssets.map(c => [c.id, c.title]))

  // Transform journal entries with resolved mention names
  const journalEntriesRaw = journalEntriesResult.data || []
  const journalEntries = journalEntriesRaw.map((entry: {
    id: string
    title: string | null
    icon: string | null
    content: string
    tags: string[] | null
    mentioned_clients: string[] | null
    mentioned_projects: string[] | null
    mentioned_content: string[] | null
    created_at: string
  }) => ({
    id: entry.id,
    title: entry.title || null,
    icon: entry.icon || null,
    content: entry.content,
    tags: entry.tags,
    created_at: entry.created_at,
    mentionedClients: (entry.mentioned_clients || []).map(id => ({
      id,
      name: clientMap.get(id) || 'Unknown Client'
    })),
    mentionedProjects: (entry.mentioned_projects || []).map(id => ({
      id,
      name: projectMap.get(id) || 'Unknown Project'
    })),
    mentionedContent: (entry.mentioned_content || []).map(id => ({
      id,
      name: contentMap.get(id) || 'Unknown Content'
    })),
  }))

  return (
    <ChatInterface
      clients={clients}
      writingFrameworks={writingFrameworksResult.data || []}
      projects={projects}
      contentAssets={contentAssets}
      journalEntries={journalEntries}
      models={modelsResult.data || []}
      initialConversations={conversationsResult.success ? conversationsResult.data || [] : []}
      initialConversationId={initialConversationId}
    />
  )
}
