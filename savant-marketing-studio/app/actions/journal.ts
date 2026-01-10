'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDefaultInbox() {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Check if Inbox already exists
  const { data: existing } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'inbox')
    .single()

  if (existing) return existing.id

  // Create new Inbox
  const { data, error } = await supabase
    .from('journal_chats')
    .insert({ name: 'Inbox', type: 'inbox' })
    .select()
    .single()

  if (error) throw error
  return data.id
}

export async function getOrCreateInbox() {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Try to get existing Inbox for this user
  const { data: existing } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'inbox')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return existing.id

  // Create new Inbox if doesn't exist
  const { data, error } = await supabase
    .from('journal_chats')
    .insert({ name: 'Inbox', type: 'inbox', user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data.id
}

export async function createJournalEntry(
  content: string,
  chatId: string,
  mentionedClients: string[],
  mentionedProjects: string[],
  mentionedContent: string[],
  tags: string[]
) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user - REQUIRED for user_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Validate required fields
  if (!content || !content.trim()) {
    throw new Error('Content is required')
  }

  if (!chatId) {
    throw new Error('Chat ID is required')
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      content: content.trim(),
      chat_id: chatId,
      mentioned_clients: mentionedClients || [],
      mentioned_projects: mentionedProjects || [],
      mentioned_content: mentionedContent || [],
      tags: tags || []
    })
    .select()

  if (error) {
    throw error
  }

  revalidatePath('/dashboard/journal')
}

export async function deleteJournalEntry(id: string) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Soft delete instead of hard delete
  const { error } = await supabase
    .from('journal_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/journal')
  revalidatePath('/dashboard/archive')
}

export async function getJournalEntries(chatId?: string) {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  let query = supabase
    .from('journal_entries')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (chatId) {
    query = query.eq('chat_id', chatId)
  }

  const { data, error } = await query.limit(50)

  if (error) throw error
  return data
}

export async function getJournalEntriesByProject(projectId: string) {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Get entries from the project's chat
  const { data: projectChat } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'project')
    .eq('linked_id', projectId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  // Query for entries mentioning this project OR in the project's chat
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .or(projectChat ? `chat_id.eq.${projectChat.id},mentioned_projects.cs.{${projectId}}` : `mentioned_projects.cs.{${projectId}}`)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return []
  }

  // Dedupe entries (in case an entry is both in project chat AND mentions the project)
  const uniqueEntries = data?.filter((entry, index, self) =>
    index === self.findIndex(e => e.id === entry.id)
  ) || []

  return uniqueEntries
}

export async function getJournalChats() {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('journal_chats')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// OPTIMIZED: Get all chats with their entries in ONE query
// Previously: 1 + N queries (1 for chats, then 1 for each chat's entries)
// Now: 1 query total using nested select
export async function getJournalChatsWithEntries() {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('journal_chats')
    .select(`
      *,
      entries:journal_entries(*)
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching journal chats with entries:', error)
    throw error
  }

  // Sort entries within each chat by created_at and filter out soft-deleted
  const chatsWithSortedEntries = (data || []).map(chat => ({
    ...chat,
    entries: (chat.entries || [])
      .filter((entry: any) => !entry.deleted_at)
      .sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
  }))

  return chatsWithSortedEntries
}

export async function createGeneralChat() {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Create new general chat with a timestamp-based name
  const chatName = `Chat ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  
  const { data, error } = await supabase
    .from('journal_chats')
    .insert({
      name: chatName,
      type: 'general',
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/journal')
  return data
}

export async function createChatForClient(clientId: string, clientName: string) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if chat already exists for this user
  const { data: existing } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'client')
    .eq('linked_id', clientId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return existing

  // Create new chat
  const { data, error } = await supabase
    .from('journal_chats')
    .insert({
      name: `Client: ${clientName}`,
      type: 'client',
      linked_id: clientId,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/journal')
  return data
}

export async function createChatForProject(projectId: string, projectName: string) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if chat already exists for this user
  const { data: existing } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'project')
    .eq('linked_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return existing

  // Create new chat
  const { data, error } = await supabase
    .from('journal_chats')
    .insert({
      name: `Project: ${projectName}`,
      type: 'project',
      linked_id: projectId,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/journal')
  return data
}

export async function createChatForContent(contentId: string, contentTitle: string) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if chat already exists for this user
  const { data: existing } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'content')
    .eq('linked_id', contentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return existing

  // Create new chat
  const { data, error } = await supabase
    .from('journal_chats')
    .insert({
      name: `Content: ${contentTitle}`,
      type: 'content',
      linked_id: contentId,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/journal')
  return data
}

export async function getJournalEntriesByContent(contentId: string) {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Get entries from the content's chat
  const { data: contentChat } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'content')
    .eq('linked_id', contentId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  // Query for entries mentioning this content OR in the content's chat
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .or(contentChat ? `chat_id.eq.${contentChat.id},mentioned_content.cs.{${contentId}}` : `mentioned_content.cs.{${contentId}}`)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return []
  }

  // Dedupe entries (in case an entry is both in content chat AND mentions the content)
  const uniqueEntries = data?.filter((entry, index, self) =>
    index === self.findIndex(e => e.id === entry.id)
  ) || []

  return uniqueEntries
}

export async function getJournalEntriesByClient(clientId: string) {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Get entries where mentioned_clients contains this clientId
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .contains('mentioned_clients', [clientId])
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return []
  }

  return data || []
}

// Bulk Actions
export async function bulkDeleteJournalEntries(ids: string[]) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Soft delete instead of hard delete
  const { error } = await supabase
    .from('journal_entries')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', user.id) // Safety: only delete user's own entries

  if (error) throw error
  revalidatePath('/dashboard/journal')
  revalidatePath('/dashboard/archive')
  return { success: true }
}

export async function restoreJournalEntry(id: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Database not configured' }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('journal_entries')
    .update({ deleted_at: null })
    .eq('id', id)
    .eq('user_id', user.id) // Safety: only restore user's own entries

  if (error) {
    console.error('Failed to restore journal entry:', error)
    return { error: 'Failed to restore journal entry' }
  }

  revalidatePath('/dashboard/journal')
  revalidatePath('/dashboard/archive')
  return { success: true }
}

export async function permanentlyDeleteJournalEntry(id: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Database not configured' }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Safety: only delete user's own entries

  if (error) {
    console.error('Failed to permanently delete journal entry:', error)
    return { error: 'Failed to permanently delete journal entry' }
  }

  revalidatePath('/dashboard/archive')
  return { success: true }
}

export async function getArchivedJournalEntries() {
  const supabase = await createClient()
  if (!supabase) return []

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch archived journal entries:', error)
    return []
  }

  return data || []
}

export async function togglePinJournalEntry(id: string, isPinned: boolean) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('journal_entries')
    .update({ is_pinned: isPinned })
    .eq('id', id)
    .eq('user_id', user.id) // Safety: only update user's own entries

  if (error) throw error
  revalidatePath('/dashboard/journal')
  return { success: true }
}

export async function bulkPinJournalEntries(ids: string[]) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('journal_entries')
    .update({ is_pinned: true })
    .in('id', ids)
    .eq('user_id', user.id) // Safety: only update user's own entries

  if (error) throw error
  revalidatePath('/dashboard/journal')
  return { success: true }
}

export async function bulkUnpinJournalEntries(ids: string[]) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('journal_entries')
    .update({ is_pinned: false })
    .in('id', ids)
    .eq('user_id', user.id) // Safety: only update user's own entries

  if (error) throw error
  revalidatePath('/dashboard/journal')
  return { success: true }
}

export async function bulkAddTagsToJournalEntries(ids: string[], newTags: string[]) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get existing entries to merge tags
  const { data: entries, error: fetchError } = await supabase
    .from('journal_entries')
    .select('id, tags')
    .in('id', ids)
    .eq('user_id', user.id)

  if (fetchError) throw fetchError

  // Update each entry with merged tags
  const updates = entries.map(entry => {
    const existingTags = entry.tags || []
    const mergedTags = Array.from(new Set([...existingTags, ...newTags]))
    return supabase
      .from('journal_entries')
      .update({ tags: mergedTags })
      .eq('id', entry.id)
      .eq('user_id', user.id)
  })

  await Promise.all(updates)
  revalidatePath('/dashboard/journal')
  return { success: true }
}

// Update Journal Entry (for future editing feature)
export async function updateJournalEntry(
  id: string,
  content: string,
  mentionedClients: string[] = [],
  mentionedProjects: string[] = [],
  mentionedContent: string[] = [],
  tags: string[] = []
) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection not configured')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .update({
      content,
      mentioned_clients: mentionedClients,
      mentioned_projects: mentionedProjects,
      mentioned_content: mentionedContent,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id) // Safety: only update user's own entries
    .select()
    .single()

  if (error) {
    console.error('Failed to update journal entry:', error)
    return { error: 'Failed to update entry' }
  }

  revalidatePath('/dashboard/journal')
  return { success: true, entry: data }
}

export async function convertEntryToContent(
  entryId: string,
  clientId: string,
  title: string,
  projectId?: string | null
) {
  const supabase = await createClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  // Get the journal entry
  const { data: entry } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single()
  
  if (!entry) {
    return { error: 'Journal entry not found' }
  }
  
  // Check if already converted
  if (entry.is_converted) {
    return { error: 'Entry already converted to content' }
  }
  
  // Create content asset
  const { data: content, error } = await supabase
    .from('content_assets')
    .insert({
      client_id: clientId,
      project_id: projectId || null,
      title,
      asset_type: 'note',
      content_json: entry.content,
      metadata: {
        source: 'journal_capture',
        original_entry_id: entryId
      }
    })
    .select()
    .single()
  
  if (error) {
    return { error: 'Failed to create content' }
  }
  
  // Update journal entry to mark as converted
  await supabase
    .from('journal_entries')
    .update({
      is_converted: true,
      converted_to_content_id: content.id
    })
    .eq('id', entryId)
  
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/journal')
  
  return { success: true, content }
}

export async function bulkConvertToContent(
  entryIds: string[],
  clientId: string,
  projectId?: string | null
) {
  const results = await Promise.all(
    entryIds.map(async (entryId, index) => {
      const title = `Journal Capture ${index + 1} - ${new Date().toLocaleDateString()}`
      return convertEntryToContent(entryId, clientId, title, projectId)
    })
  )
  
  const errors = results.filter(r => r.error)
  const successes = results.filter(r => r.success)
  
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/journal')
  
  return { 
    success: successes.length > 0, 
    converted: successes.length, 
    failed: errors.length 
  }
}
