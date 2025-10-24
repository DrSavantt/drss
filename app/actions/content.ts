'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getContentAssets(clientId: string) {
  const supabase = await createSupabaseClient()
  
  const { data: content, error } = await supabase
    .from('content_assets')
    .select('*, projects(name)')
    .eq('client_id', clientId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching content:', error)
    return []
  }
  
  return content
}

export async function getContentAsset(id: string) {
  const supabase = await createSupabaseClient()
  
  const { data: content, error } = await supabase
    .from('content_assets')
    .select('*, clients(name), projects(name)')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching content:', error)
    return null
  }
  
  return content
}

export async function createContentAsset(clientId: string, formData: FormData) {
  const supabase = await createSupabaseClient()
  
  const title = formData.get('title') as string
  const project_id = formData.get('project_id') as string
  const content_json = formData.get('content_json') as string
  
  if (!title) {
    return { error: 'Title is required' }
  }
  
  if (!content_json) {
    return { error: 'Content is required' }
  }
  
  const { data, error } = await supabase
    .from('content_assets')
    .insert({
      client_id: clientId,
      project_id: project_id || null,
      title,
      asset_type: 'note',
      content_json: JSON.parse(content_json),
      metadata: {}
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating content:', error)
    return { error: 'Failed to create content' }
  }
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/clients/${clientId}`)
}

export async function updateContentAsset(id: string, formData: FormData) {
  const supabase = await createSupabaseClient()
  
  const title = formData.get('title') as string
  const project_id = formData.get('project_id') as string
  const content_json = formData.get('content_json') as string
  
  if (!title) {
    return { error: 'Title is required' }
  }
  
  const { error } = await supabase
    .from('content_assets')
    .update({
      title,
      project_id: project_id || null,
      content_json: content_json ? JSON.parse(content_json) : undefined
    })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating content:', error)
    return { error: 'Failed to update content' }
  }
  
  return { success: true }
}

export async function deleteContentAsset(id: string, clientId: string) {
  const supabase = await createSupabaseClient()
  
  const { error } = await supabase
    .from('content_assets')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting content:', error)
    return { error: 'Failed to delete content' }
  }
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}

export async function getClientProjects(clientId: string) {
  const supabase = await createSupabaseClient()
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('client_id', clientId)
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }
  
  return projects
}
