'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
    console.error('Error fetching clients:', error)
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
    console.error('Error fetching client:', error)
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
  
  const { error } = await supabase
    .from('clients')
    .insert({
      name,
      email: email || null,
      website: website || null,
      user_id: user.id
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating client:', error)
    return { error: 'Failed to create client' }
  }
  
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
    console.error('Error updating client:', error)
    return { error: 'Failed to update client' }
  }
  
  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${id}`)
  return { success: true }
}

export async function deleteClient(id: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting client:', error)
    return { error: 'Failed to delete client' }
  }
  
  revalidatePath('/dashboard/clients')
  redirect('/dashboard/clients')
}

