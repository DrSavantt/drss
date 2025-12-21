'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'

export async function getContentAssets(clientId: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return []
  }
  
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
  
  if (!supabase) {
    return null
  }
  
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
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  const title = formData.get('title') as string
  const project_id = formData.get('project_id') as string
  const content_json = formData.get('content_json') as string
  
  if (!title) {
    return { error: 'Title is required' }
  }
  
  if (!content_json) {
    return { error: 'Content is required' }
  }
  
  // Try to parse as JSON (for backwards compatibility), otherwise store as HTML string
  let contentValue: string | object
  try {
    contentValue = JSON.parse(content_json)
  } catch {
    // It's HTML content, store as-is
    contentValue = content_json
  }
  
  const { data, error } = await supabase
    .from('content_assets')
    .insert({
      client_id: clientId,
      project_id: project_id || null,
      title,
      asset_type: 'note',
      content_json: contentValue,
      metadata: {}
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating content:', error)
    return { error: 'Failed to create content' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'content_created',
    entityType: 'content',
    entityId: data.id,
    entityName: data.title,
    metadata: { client_id: clientId, asset_type: 'note' }
  })
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/clients/${clientId}`)
}

export async function updateContentAsset(id: string, formData: FormData) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
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
  
  // Log activity
  await logActivity({
    activityType: 'content_updated',
    entityType: 'content',
    entityId: id,
    entityName: title
  })
  
  return { success: true }
}

export async function getContentRelatedCounts(contentId: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { captures: 0 }
  }
  
  // Count journal entries mentioning this content
  const { count: capturesCount } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .contains('mentioned_content', [contentId])
  
  return {
    captures: capturesCount ?? 0
  }
}

export async function deleteContentAsset(id: string, clientId: string, deleteOption: 'all' | 'preserve' = 'preserve', contentTitle?: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  // Get content title if not provided
  let title = contentTitle
  if (!title) {
    const { data: content } = await supabase
      .from('content_assets')
      .select('title')
      .eq('id', id)
      .single()
    title = content?.title
  }
  
  if (deleteOption === 'preserve') {
    // Remove content from journal captures (remove from mentioned_content array)
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('id, mentioned_content')
      .contains('mentioned_content', [id])
    
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        const updatedContent = (entry.mentioned_content || []).filter((cid: string) => cid !== id)
        await supabase
          .from('journal_entries')
          .update({ mentioned_content: updatedContent })
          .eq('id', entry.id)
      }
    }
  } else if (deleteOption === 'all') {
    // Delete all journal entries mentioning this content
    await supabase
      .from('journal_entries')
      .delete()
      .contains('mentioned_content', [id])
  }
  
  const { error } = await supabase
    .from('content_assets')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting content:', error)
    return { error: 'Failed to delete content' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'content_deleted',
    entityType: 'content',
    entityId: id,
    entityName: title
  })
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}

export async function getAllContentAssets() {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return []
  }
  
  const { data: content, error } = await supabase
    .from('content_assets')
    .select('*, clients(name), projects(name)')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching all content:', error)
    return []
  }
  
  return content
}

export async function getClientProjects(clientId: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return []
  }
  
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

export async function createFileAsset(clientId: string, formData: FormData) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  const title = formData.get('title') as string
  const project_id = formData.get('project_id') as string
  const file_url = formData.get('file_url') as string
  const file_size = parseInt(formData.get('file_size') as string)
  const file_type = formData.get('file_type') as string
  const asset_type = formData.get('asset_type') as string
  
  if (!title) {
    return { error: 'Title is required' }
  }
  
  if (!file_url) {
    return { error: 'File is required' }
  }
  
  const { data, error } = await supabase
    .from('content_assets')
    .insert({
      client_id: clientId,
      project_id: project_id || null,
      title,
      asset_type,
      file_url,
      file_size,
      file_type,
      metadata: {}
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating file asset:', error)
    return { error: 'Failed to create file asset' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'file_uploaded',
    entityType: 'file',
    entityId: data.id,
    entityName: data.title,
    metadata: { 
      file_size: file_size, 
      file_type: file_type,
      client_id: clientId 
    }
  })
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/clients/${clientId}`)
}

export async function getUploadUrl(fileName: string, clientId: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  // Create unique file path: clientId/timestamp-filename
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${clientId}/${timestamp}-${sanitizedFileName}`
  
  const { data, error } = await supabase.storage
    .from('client-files')
    .createSignedUploadUrl(filePath)
  
  if (error) {
    console.error('Error creating upload URL:', error)
    return { error: 'Failed to create upload URL' }
  }
  
  return { 
    signedUrl: data.signedUrl, 
    path: data.path,
    token: data.token 
  }
}

export async function bulkDeleteContent(contentIds: string[]) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  if (!contentIds || contentIds.length === 0) {
    return { error: 'No content IDs provided' }
  }
  
  const { error } = await supabase
    .from('content_assets')
    .delete()
    .in('id', contentIds)
  
  if (error) {
    console.error('Error bulk deleting content:', error)
    return { error: 'Failed to delete content' }
  }
  
  revalidatePath('/dashboard/content')
  return { success: true, count: contentIds.length }
}

export async function bulkArchiveContent(contentIds: string[]) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  if (!contentIds || contentIds.length === 0) {
    return { error: 'No content IDs provided' }
  }
  
  const { error } = await supabase
    .from('content_assets')
    .update({ is_archived: true })
    .in('id', contentIds)
  
  if (error) {
    console.error('Error bulk archiving content:', error)
    return { error: 'Failed to archive content' }
  }
  
  revalidatePath('/dashboard/content')
  return { success: true, count: contentIds.length }
}

export async function bulkUnarchiveContent(contentIds: string[]) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  if (!contentIds || contentIds.length === 0) {
    return { error: 'No content IDs provided' }
  }
  
  const { error } = await supabase
    .from('content_assets')
    .update({ is_archived: false })
    .in('id', contentIds)
  
  if (error) {
    console.error('Error bulk unarchiving content:', error)
    return { error: 'Failed to unarchive content' }
  }
  
  revalidatePath('/dashboard/content')
  return { success: true, count: contentIds.length }
}

export async function bulkChangeProject(contentIds: string[], projectId: string | null) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  if (!contentIds || contentIds.length === 0) {
    return { error: 'No content IDs provided' }
  }
  
  const { error } = await supabase
    .from('content_assets')
    .update({ project_id: projectId })
    .in('id', contentIds)
  
  if (error) {
    console.error('Error bulk changing project:', error)
    return { error: 'Failed to change project' }
  }
  
  revalidatePath('/dashboard/content')
  return { success: true, count: contentIds.length }
}

export async function getAllProjects() {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return []
  }
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, clients(name)')
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching all projects:', error)
    return []
  }
  
  return projects
}
