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
  
  console.log('Creating journal entry:', {
    user_id: user.id,
    content,
    chat_id: chatId,
    mentioned_clients: mentionedClients,
    tags
  })
  
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      content: content.trim(),
      chat_id: chatId,
      mentioned_clients: mentionedClients || [],
      tags: tags || []
    })
    .select()
  
  if (error) {
    console.error('Error creating journal entry:', error)
    throw error
  }
  
  console.log('Journal entry created:', data)
  revalidatePath('/dashboard/journal')
}

export async function deleteJournalEntry(id: string) {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  revalidatePath('/dashboard/journal')
}

export async function getJournalEntries(chatId?: string) {
  const supabase = await createClient()
  
  if (!supabase) {
    return []
  }
  
  let query = supabase
    .from('journal_entries')
    .select('*')
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
    .maybeSingle()
  
  if (!projectChat) {
    return []
  }
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('chat_id', projectChat.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error fetching project journal entries:', error)
    return []
  }
  
  return data || []
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
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
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
    .maybeSingle()
  
  if (!contentChat) {
    return []
  }
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('chat_id', contentChat.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error fetching content journal entries:', error)
    return []
  }
  
  return data || []
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
    .contains('mentioned_clients', [clientId])
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error fetching client journal entries:', error)
    return []
  }
  
  return data || []
}
