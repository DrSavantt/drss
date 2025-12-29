'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'

export async function getClients() {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return []
  }
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    return []
  }
  
  return clients
}

export async function getClient(id: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return null
  }
  
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    return null
  }
  
  return client
}

export async function createClient(formData: FormData) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const website = formData.get('website') as string
  
  if (!name) {
    return { error: 'Client name is required' }
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name,
      email: email || null,
      website: website || null,
      user_id: user.id,
      questionnaire_token: crypto.randomUUID()
    })
    .select()
    .single()
  
  if (error) {
    return { error: 'Failed to create client' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'client_created',
    entityType: 'client',
    entityId: data.id,
    entityName: data.name
  })
  
  revalidatePath('/dashboard/clients')
  redirect('/dashboard/clients')
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const website = formData.get('website') as string
  
  if (!name) {
    return { error: 'Client name is required' }
  }
  
  const { error } = await supabase
    .from('clients')
    .update({
      name,
      email: email || null,
      website: website || null
    })
    .eq('id', id)
  
  if (error) {
    return { error: 'Failed to update client' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'client_updated',
    entityType: 'client',
    entityId: id,
    entityName: name
  })
  
  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${id}`)
  return { success: true }
}

export async function getRelatedCounts(clientId: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { projects: 0, content: 0, captures: 0 }
  }
  
  // Count projects
  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
  
  // Count content
  const { count: contentCount } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
  
  // Count journal entries mentioning this client
  const { count: capturesCount } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .contains('mentioned_clients', [clientId])
  
  return {
    projects: projectsCount ?? 0,
    content: contentCount ?? 0,
    captures: capturesCount ?? 0
  }
}

export async function deleteClient(id: string, deleteOption: 'all' | 'preserve' = 'preserve', clientName?: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  // Get client name if not provided
  let name = clientName
  if (!name) {
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', id)
      .single()
    name = client?.name
  }
  
  if (deleteOption === 'preserve') {
    // Remove client from journal captures (remove from mentioned_clients array)
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('id, mentioned_clients')
      .contains('mentioned_clients', [id])
    
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        const updatedClients = (entry.mentioned_clients || []).filter((cid: string) => cid !== id)
        await supabase
          .from('journal_entries')
          .update({ mentioned_clients: updatedClients })
          .eq('id', entry.id)
      }
    }
  } else if (deleteOption === 'all') {
    // Delete all journal entries mentioning this client
    await supabase
      .from('journal_entries')
      .delete()
      .contains('mentioned_clients', [id])
  }
  
  // Delete projects (will cascade to content if FK constraints are set)
  await supabase
    .from('projects')
    .delete()
    .eq('client_id', id)
  
  // Delete content
  await supabase
    .from('content_assets')
    .delete()
    .eq('client_id', id)
  
  // Delete client
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  
  if (error) {
    return { error: 'Failed to delete client' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'client_deleted',
    entityType: 'client',
    entityId: id,
    entityName: name
  })
  
  revalidatePath('/dashboard/clients')
  redirect('/dashboard/clients')
}

