'use server'

import { createClient } from '@/lib/supabase/server'

export interface AIBarContext {
  clients: Array<{ id: string; name: string }>
  projects: Array<{ id: string; name: string; clientName?: string | null }>
  contentAssets: Array<{ id: string; title: string; contentType?: string | null }>
  journalEntries: Array<{ id: string; title: string | null; content: string }>
  writingFrameworks: Array<{ id: string; name: string; category?: string }>
  models: Array<{ id: string; model_name: string; display_name: string; max_tokens: number }>
}

/**
 * Centralized server action to fetch all context data for the AI bar.
 * This ensures consistent filtering (including deleted_at IS NULL) across all components.
 */
export async function getAIBarContext(): Promise<AIBarContext> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection unavailable')
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const [
    clientsRes,
    projectsRes,
    contentRes,
    journalRes,
    frameworksRes,
    modelsRes
  ] = await Promise.all([
    // Clients - MUST filter deleted_at
    supabase
      .from('clients')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),
    // Projects - MUST filter deleted_at
    supabase
      .from('projects')
      .select('id, name, clients(name)')
      .is('deleted_at', null)
      .order('name'),
    // Content Assets - already filtered deleted_at
    supabase
      .from('content_assets')
      .select('id, title, asset_type')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    // Journal Entries - already filtered deleted_at
    supabase
      .from('journal_entries')
      .select('id, title, content')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(100),
    // Marketing Frameworks - filter deleted_at
    supabase
      .from('marketing_frameworks')
      .select('id, name, category')
      .is('deleted_at', null)
      .order('name'),
    // AI Models - only active ones
    supabase
      .from('ai_models')
      .select('id, model_name, display_name, max_tokens')
      .eq('is_active', true)
      .order('display_name'),
  ])

  return {
    clients: clientsRes.data || [],
    projects: projectsRes.data?.map(p => ({
      id: p.id,
      name: p.name,
      // Supabase returns joined relations as objects or arrays depending on relationship
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clientName: ((p.clients as any)?.name as string) || null
    })) || [],
    contentAssets: contentRes.data?.map(c => ({
      id: c.id,
      title: c.title,
      contentType: c.asset_type
    })) || [],
    journalEntries: journalRes.data || [],
    writingFrameworks: frameworksRes.data?.map(f => ({
      id: f.id,
      name: f.name,
      category: f.category ?? undefined
    })) || [],
    models: modelsRes.data || [],
  }
}
