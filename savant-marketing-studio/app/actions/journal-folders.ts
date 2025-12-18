'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface JournalFolder {
  id: string
  user_id: string
  name: string
  color: string
  position: number
  created_at: string
  updated_at: string
  chat_count?: number
}

// Get all folders for current user
export async function getJournalFolders(): Promise<JournalFolder[]> {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get folders with chat counts
  const { data: folders, error } = await supabase
    .from('journal_folders')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })
  
  if (error) {
    console.error('Error fetching folders:', error)
    return []
  }
  
  // Get chat counts per folder
  const { data: chatCounts } = await supabase
    .from('journal_chats')
    .select('folder_id')
    .eq('user_id', user.id)
    .not('folder_id', 'is', null)
  
  const countMap: Record<string, number> = {}
  chatCounts?.forEach(chat => {
    if (chat.folder_id) {
      countMap[chat.folder_id] = (countMap[chat.folder_id] || 0) + 1
    }
  })
  
  return folders.map(folder => ({
    ...folder,
    chat_count: countMap[folder.id] || 0
  }))
}

// Create a new folder
export async function createJournalFolder(name: string, color: string = '#EF4444') {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get max position
  const { data: existing } = await supabase
    .from('journal_folders')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
    .single()
  
  const nextPosition = (existing?.position || 0) + 1
  
  const { data, error } = await supabase
    .from('journal_folders')
    .insert({
      user_id: user.id,
      name,
      color,
      position: nextPosition
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating folder:', error)
    throw new Error('Failed to create folder')
  }
  
  revalidatePath('/dashboard/journal')
  return data
}

// Update a folder
export async function updateJournalFolder(folderId: string, name: string, color?: string) {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const updates: { name: string; color?: string } = { name }
  if (color) updates.color = color
  
  const { error } = await supabase
    .from('journal_folders')
    .update(updates)
    .eq('id', folderId)
  
  if (error) {
    console.error('Error updating folder:', error)
    throw new Error('Failed to update folder')
  }
  
  revalidatePath('/dashboard/journal')
}

// Delete a folder (chats will have folder_id set to null)
export async function deleteJournalFolder(folderId: string) {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { error } = await supabase
    .from('journal_folders')
    .delete()
    .eq('id', folderId)
  
  if (error) {
    console.error('Error deleting folder:', error)
    throw new Error('Failed to delete folder')
  }
  
  revalidatePath('/dashboard/journal')
}

// Move a chat to a folder
export async function moveChatToFolder(chatId: string, folderId: string | null) {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { error } = await supabase
    .from('journal_chats')
    .update({ folder_id: folderId })
    .eq('id', chatId)
  
  if (error) {
    console.error('Error moving chat to folder:', error)
    throw new Error('Failed to move chat')
  }
  
  revalidatePath('/dashboard/journal')
}

// Get all chats with their entries (for unified timeline)
export async function getUnifiedJournalTimeline(folderId?: string | null) {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Build query for chats
  let query = supabase
    .from('journal_chats')
    .select(`
      id,
      name,
      type,
      linked_id,
      folder_id,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
  
  // Filter by folder if specified
  if (folderId) {
    query = query.eq('folder_id', folderId)
  }
  
  const { data: chats, error } = await query
  
  if (error) {
    console.error('Error fetching timeline:', error)
    return []
  }
  
  // Get entry counts for each chat
  const chatIds = chats.map(c => c.id)
  const { data: entryCounts } = await supabase
    .from('journal_entries')
    .select('chat_id')
    .in('chat_id', chatIds)
  
  const countMap: Record<string, number> = {}
  entryCounts?.forEach(entry => {
    countMap[entry.chat_id] = (countMap[entry.chat_id] || 0) + 1
  })
  
  // Get latest entry for each chat to show preview
  const { data: latestEntries } = await supabase
    .from('journal_entries')
    .select('chat_id, content, tags, created_at')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: false })
  
  // Group by chat_id and take first (latest)
  const latestMap: Record<string, { content: string; tags: string[]; created_at: string }> = {}
  latestEntries?.forEach(entry => {
    if (!latestMap[entry.chat_id]) {
      latestMap[entry.chat_id] = entry
    }
  })
  
  return chats.map(chat => ({
    ...chat,
    entry_count: countMap[chat.id] || 0,
    latest_entry: latestMap[chat.id] || null
  }))
}

// Get total counts for all items and per folder
export async function getJournalCounts() {
  const supabase = await createClient()
  
  if (!supabase) {
    throw new Error('Database connection not configured')
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Total chats
  const { count: totalChats } = await supabase
    .from('journal_chats')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  
  // Total entries
  const { count: totalEntries } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
  
  return {
    totalChats: totalChats || 0,
    totalEntries: totalEntries || 0
  }
}

