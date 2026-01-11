'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'

// ===== SERVICE ROLE CLIENT (Bypasses RLS for admin operations) =====
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for service client')
  }
  
  return createServiceClient(supabaseUrl, supabaseServiceKey)
}

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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (error) {
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
    .is('deleted_at', null)
    .single()
  
  if (error) {
    return null
  }
  
  // Fetch journal entries that @mention this content
  const { data: relatedCaptures } = await supabase
    .from('journal_entries')
    .select('id, content, created_at')
    .contains('mentioned_content', [id])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  return {
    ...content,
    related_captures: relatedCaptures || []
  }
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
    return { error: 'Failed to create content' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'content_created',
    entityType: 'content',
    entityId: data.id,
    entityName: data.title,
    clientId: clientId,
    metadata: { client_id: clientId, asset_type: 'note' }
  })
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/clients/${clientId}`)
}

export async function updateContentAsset(id: string, formData: FormData) {
  // Use service role client to bypass RLS for trusted server operations
  const supabase = getServiceClient()
  
  // Get current content to find client_id
  const { data: currentContent, error: fetchError } = await supabase
    .from('content_assets')
    .select('client_id')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('[updateContentAsset] Failed to fetch content:', fetchError)
    return { error: 'Content not found' }
  }
  
  const title = formData.get('title') as string
  const project_id = formData.get('project_id') as string
  const content_json = formData.get('content_json') as string
  
  if (!title) {
    return { error: 'Title is required' }
  }
  
  // Try to parse as JSON (for backwards compatibility), otherwise store as HTML string
  let contentValue: string | object | undefined
  if (content_json) {
    try {
      contentValue = JSON.parse(content_json)
    } catch {
      // It's HTML content, store as-is
      contentValue = content_json
    }
  }
  
  const { error } = await supabase
    .from('content_assets')
    .update({
      title,
      project_id: project_id || null,
      content_json: contentValue
    })
    .eq('id', id)
  
  if (error) {
    console.error('[updateContentAsset] Update failed:', error)
    return { error: 'Failed to update content' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'content_updated',
    entityType: 'content',
    entityId: id,
    entityName: title,
    clientId: currentContent?.client_id
  })
  
  revalidatePath('/dashboard/content')
  revalidatePath(`/dashboard/content/${id}`)
  if (currentContent?.client_id) {
    revalidatePath(`/dashboard/clients/${currentContent.client_id}`)
  }
  
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
    .is('deleted_at', null)
  
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
    // Soft delete all journal entries mentioning this content
    await supabase
      .from('journal_entries')
      .update({ deleted_at: new Date().toISOString() })
      .contains('mentioned_content', [id])
  }
  
  // Soft delete the content asset
  const { error } = await supabase
    .from('content_assets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  
  if (error) {
    return { error: 'Failed to delete content' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'content_deleted',
    entityType: 'content',
    entityId: id,
    entityName: title,
    clientId: clientId,
    metadata: { can_restore: true }
  })
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/archive')
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (error) {
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
    .is('deleted_at', null)
    .order('name', { ascending: true })
  
  if (error) {
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
    return { error: 'Failed to create file asset' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'file_uploaded',
    entityType: 'file',
    entityId: data.id,
    entityName: data.title,
    clientId: clientId,
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
  
  // Soft delete instead of hard delete
  const { error } = await supabase
    .from('content_assets')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', contentIds)
  
  if (error) {
    return { error: 'Failed to delete content' }
  }
  
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/archive')
  return { success: true, count: contentIds.length }
}

export async function restoreContentAsset(id: string) {
  const supabase = await createSupabaseClient()
  if (!supabase) return { error: 'Database not configured' }

  // First, get the content to find client_id for revalidation
  const { data: content } = await supabase
    .from('content_assets')
    .select('client_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('content_assets')
    .update({ deleted_at: null })
    .eq('id', id)

  if (error) {
    console.error('Failed to restore content:', error)
    return { error: 'Failed to restore content' }
  }

  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/archive')
  
  // Also revalidate client page if content belongs to a client
  if (content?.client_id) {
    revalidatePath(`/dashboard/clients/${content.client_id}`)
  }
  
  return { success: true }
}

export async function permanentlyDeleteContentAsset(id: string) {
  const supabase = await createSupabaseClient()
  if (!supabase) return { error: 'Database not configured' }

  const { error } = await supabase
    .from('content_assets')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to permanently delete content:', error)
    return { error: 'Failed to permanently delete content' }
  }

  revalidatePath('/dashboard/archive')
  return { success: true }
}

export async function getArchivedContent() {
  const supabase = await createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('content_assets')
    .select(`
      *,
      clients (id, name)
    `)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch archived content:', error)
    return []
  }

  return data || []
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
    return { error: 'Failed to change project' }
  }
  
  revalidatePath('/dashboard/content')
  return { success: true, count: contentIds.length }
}

/**
 * Reassign content to a different client (or remove client association)
 * Also updates related ai_executions to maintain accurate AI history per client
 */
export async function reassignContentToClient(
  contentAssetId: string, 
  newClientId: string | null
) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }
  
  // Get current content to find old client_id for revalidation
  const { data: currentContent, error: fetchError } = await supabase
    .from('content_assets')
    .select('client_id, title')
    .eq('id', contentAssetId)
    .single()
  
  if (fetchError) {
    return { error: 'Content not found' }
  }
  
  const oldClientId = currentContent?.client_id
  
  // 1. Update content_assets
  const { error: contentError } = await supabase
    .from('content_assets')
    .update({ 
      client_id: newClientId,
      project_id: null // Clear project since it belongs to old client
    })
    .eq('id', contentAssetId)
  
  if (contentError) {
    console.error('Failed to reassign content:', contentError)
    return { error: 'Failed to reassign content' }
  }
  
  // 2. Update related ai_executions (cascade the client change)
  // This ensures AI history follows the content to the new client
  const { error: executionError } = await supabase
    .from('ai_executions')
    .update({ client_id: newClientId })
    .eq('content_asset_id', contentAssetId)
  
  if (executionError) {
    console.error('Failed to update ai_executions:', executionError)
    // Don't return error - content was already updated successfully
  }
  
  // Log activity
  await logActivity({
    activityType: 'content_updated',
    entityType: 'content',
    entityId: contentAssetId,
    entityName: currentContent?.title,
    clientId: newClientId || undefined,
    metadata: { 
      old_client_id: oldClientId,
      new_client_id: newClientId,
      action: 'reassigned_client'
    }
  })
  
  // Revalidate affected pages
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/research')
  if (oldClientId) {
    revalidatePath(`/dashboard/clients/${oldClientId}`)
  }
  if (newClientId) {
    revalidatePath(`/dashboard/clients/${newClientId}`)
  }
  
  return { success: true }
}

/**
 * Bulk reassign multiple content items to a different client
 */
export async function bulkReassignContentToClient(
  contentIds: string[], 
  newClientId: string | null
) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  if (!contentIds || contentIds.length === 0) {
    return { error: 'No content IDs provided' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }
  
  // Get old client IDs for revalidation
  const { data: contents } = await supabase
    .from('content_assets')
    .select('client_id')
    .in('id', contentIds)
  
  const oldClientIds = [...new Set(contents?.map(c => c.client_id).filter(Boolean) || [])]
  
  // 1. Update content_assets
  const { error: contentError } = await supabase
    .from('content_assets')
    .update({ 
      client_id: newClientId,
      project_id: null // Clear project since it belongs to old client
    })
    .in('id', contentIds)
  
  if (contentError) {
    return { error: 'Failed to reassign content' }
  }
  
  // 2. Update related ai_executions
  const { error: executionError } = await supabase
    .from('ai_executions')
    .update({ client_id: newClientId })
    .in('content_asset_id', contentIds)
  
  if (executionError) {
    console.error('Failed to update ai_executions:', executionError)
  }
  
  // Revalidate affected pages
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/research')
  for (const clientId of oldClientIds) {
    revalidatePath(`/dashboard/clients/${clientId}`)
  }
  if (newClientId) {
    revalidatePath(`/dashboard/clients/${newClientId}`)
  }
  
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
    .is('deleted_at', null)
    .order('name', { ascending: true })
  
  if (error) {
    return []
  }
  
  return projects
}
