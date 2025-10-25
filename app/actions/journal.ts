'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDefaultInbox() {
  const supabase = await createClient()
  
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
  
  // Try to get existing Inbox
  const { data: existing } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'inbox')
    .maybeSingle()
  
  if (existing) return existing.id
  
  // Create new Inbox if doesn't exist
  const { data, error } = await supabase
    .from('journal_chats')
    .insert({ name: 'Inbox', type: 'inbox' })
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
  
  const { error } = await supabase
    .from('journal_entries')
    .insert({
      content,
      chat_id: chatId,
      mentioned_clients: mentionedClients,
      tags
    })
  
  if (error) throw error
  revalidatePath('/dashboard/journal')
}

export async function deleteJournalEntry(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  revalidatePath('/dashboard/journal')
}

export async function getJournalEntries(chatId?: string) {
  const supabase = await createClient()
  
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

export async function getJournalChats() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('journal_chats')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function createChatForClient(clientId: string, clientName: string) {
  const supabase = await createClient()
  
  // Check if chat already exists
  const { data: existing } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'client')
    .eq('linked_id', clientId)
    .maybeSingle()
  
  if (existing) return existing
  
  // Create new chat
  const { data, error } = await supabase
    .from('journal_chats')
    .insert({
      name: `Client: ${clientName}`,
      type: 'client',
      linked_id: clientId
    })
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/dashboard/journal')
  return data
}

export async function createChatForProject(projectId: string, projectName: string) {
  const supabase = await createClient()
  
  // Check if chat already exists
  const { data: existing } = await supabase
    .from('journal_chats')
    .select('id')
    .eq('type', 'project')
    .eq('linked_id', projectId)
    .maybeSingle()
  
  if (existing) return existing
  
  // Create new chat
  const { data, error } = await supabase
    .from('journal_chats')
    .insert({
      name: `Project: ${projectName}`,
      type: 'project',
      linked_id: projectId
    })
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/dashboard/journal')
  return data
}
