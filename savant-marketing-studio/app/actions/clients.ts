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
    .is('deleted_at', null)
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
    .is('deleted_at', null)
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
  const industry = formData.get('industry') as string
  
  if (!name) {
    return { error: 'Client name is required' }
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  console.log('[createClient] Attempting insert for user:', user.id)
  console.log('[createClient] Data:', { name, email, website, industry })
  
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name,
      email: email || null,
      website: website || null,
      industry: industry || null,
      user_id: user.id,
      questionnaire_token: crypto.randomUUID()
    })
    .select()
    .single()
  
  if (error) {
    console.error('[createClient] Supabase error:', error.message, error.details, error.hint, error.code)
    return { error: `Failed to create client: ${error.message}` }
  }
  
  // Log activity
  await logActivity({
    activityType: 'client_created',
    entityType: 'client',
    entityId: data.id,
    entityName: data.name,
    clientId: data.id
  })
  
  revalidatePath('/dashboard/clients')
  
  // Return success - let the calling component handle navigation
  return { success: true, client: data }
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const website = formData.get('website') as string
  const industry = formData.get('industry') as string
  
  if (!name) {
    return { error: 'Client name is required' }
  }
  
  const { error } = await supabase
    .from('clients')
    .update({
      name,
      email: email || null,
      website: website || null,
      industry: industry || null
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
    entityName: name,
    clientId: id
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
    .is('deleted_at', null)
  
  // Count content
  const { count: contentCount } = await supabase
    .from('content_assets')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .is('deleted_at', null)
  
  // Count journal entries mentioning this client
  const { count: capturesCount } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .contains('mentioned_clients', [clientId])
    .is('deleted_at', null)
  
  return {
    projects: projectsCount ?? 0,
    content: contentCount ?? 0,
    captures: capturesCount ?? 0
  }
}

export async function deleteClient(
  id: string, 
  deleteOption: 'preserve' | 'delete_all' = 'preserve',
  clientName?: string
) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not available' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const now = new Date().toISOString()

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

  try {
    if (deleteOption === 'delete_all') {
      // Soft delete ALL related content
      
      // Soft delete projects for this client
      const { error: projectsError } = await supabase
        .from('projects')
        .update({ deleted_at: now })
        .eq('client_id', id)
      
      if (projectsError) console.error('Error deleting projects:', projectsError)
      
      // Soft delete content assets for this client
      const { error: contentError } = await supabase
        .from('content_assets')
        .update({ deleted_at: now })
        .eq('client_id', id)
      
      if (contentError) console.error('Error deleting content:', contentError)
      
      // Soft delete journal entries that mention this client
      // The mentioned_clients column stores client IDs in an array
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select('id, mentioned_clients')
        .contains('mentioned_clients', [id])
      
      if (journalEntries && journalEntries.length > 0) {
        const entryIds = journalEntries.map(e => e.id)
        const { error: journalError } = await supabase
          .from('journal_entries')
          .update({ deleted_at: now })
          .in('id', entryIds)
        
        if (journalError) console.error('Error deleting journal entries:', journalError)
      }
      
      // Also try to find entries by client name in content (fallback)
      if (name) {
        const { data: entriesByName } = await supabase
          .from('journal_entries')
          .select('id')
          .ilike('content', `%@${name}%`)
          .is('deleted_at', null)
        
        if (entriesByName && entriesByName.length > 0) {
          const entryIds = entriesByName.map(e => e.id)
          await supabase
            .from('journal_entries')
            .update({ deleted_at: now })
            .in('id', entryIds)
        }
      }
      
    } else {
      // PRESERVE option: Unlink content from client (set client_id to null)
      
      // Unlink projects
      await supabase
        .from('projects')
        .update({ client_id: null })
        .eq('client_id', id)
      
      // Unlink content assets
      await supabase
        .from('content_assets')
        .update({ client_id: null })
        .eq('client_id', id)
      
      // For journal entries, remove client from mentioned_clients array
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
    }

    // Soft delete the client itself
    const { error } = await supabase
      .from('clients')
      .update({ 
        deleted_at: now,
        deleted_by: user.id 
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to delete client:', error)
      return { error: error.message }
    }

    // Log activity
    await logActivity({
      activityType: 'client_deleted',
      entityType: 'client',
      entityId: id,
      entityName: name,
      clientId: id,
      metadata: { 
        client_name: name, 
        delete_option: deleteOption,
        can_restore: true 
      }
    })

    revalidatePath('/dashboard/clients')
    revalidatePath('/dashboard/archive')
    revalidatePath('/dashboard/journal')
    
    return { success: true }
  } catch (err) {
    console.error('Delete client error:', err)
    return { error: 'Failed to delete client' }
  }
}

export async function restoreClient(id: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not available' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Restore the client
    const { error } = await supabase
      .from('clients')
      .update({ 
        deleted_at: null,
        deleted_by: null 
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to restore client:', error)
      return { error: error.message }
    }

    // Also restore related items that were soft-deleted at the same time
    await supabase
      .from('projects')
      .update({ deleted_at: null })
      .eq('client_id', id)
    
    await supabase
      .from('content_assets')
      .update({ deleted_at: null })
      .eq('client_id', id)

    // Restore journal entries mentioning this client
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('id')
      .contains('mentioned_clients', [id])
    
    if (journalEntries && journalEntries.length > 0) {
      await supabase
        .from('journal_entries')
        .update({ deleted_at: null })
        .in('id', journalEntries.map(e => e.id))
    }

    revalidatePath('/dashboard/clients')
    revalidatePath('/dashboard/archive')
    revalidatePath('/dashboard/journal')
    
    return { success: true }
  } catch (err) {
    console.error('Restore client error:', err)
    return { error: 'Failed to restore client' }
  }
}

export async function getArchivedClients() {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not available' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch archived clients:', error)
    return []
  }

  return data || []
}

export async function permanentlyDeleteClient(id: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not available' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // First delete related data (hard delete)
    await supabase.from('projects').delete().eq('client_id', id)
    await supabase.from('content_assets').delete().eq('client_id', id)
    
    // Delete journal entries mentioning this client
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('id')
      .contains('mentioned_clients', [id])
    
    if (journalEntries && journalEntries.length > 0) {
      await supabase
        .from('journal_entries')
        .delete()
        .in('id', journalEntries.map(e => e.id))
    }

    // Finally delete the client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to permanently delete client:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/archive')
    
    return { success: true }
  } catch (err) {
    console.error('Permanent delete error:', err)
    return { error: 'Failed to permanently delete client' }
  }
}

