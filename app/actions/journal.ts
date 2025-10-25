'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createJournalEntry(
  content: string,
  mentionedClients: string[],
  tags: string[]
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      content,
      mentioned_clients: mentionedClients,
      tags
    })
    .select()
    .single()
  
  if (error) throw error
  
  revalidatePath('/dashboard/journal')
  return data
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

export async function getJournalEntries() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return data
}

