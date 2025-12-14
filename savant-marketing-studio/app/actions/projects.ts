'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/activity-log'

export async function getProjects(clientId: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return []
  }
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }
  
  return projects
}

export async function getProject(id: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return null
  }
  
  const { data: project, error } = await supabase
    .from('projects')
    .select('*, clients(*)')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching project:', error)
    return null
  }
  
  return project
}

export async function createProject(clientId: string, formData: FormData) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const due_date = formData.get('due_date') as string
  const priority = formData.get('priority') as string
  
  if (!name) {
    return { error: 'Project name is required' }
  }
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      client_id: clientId,
      name,
      description: description || null,
      due_date: due_date || null,
      priority: priority || 'medium',
      status: 'backlog'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating project:', error)
    return { error: 'Failed to create project' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'project_created',
    entityType: 'project',
    entityId: data.id,
    entityName: data.name,
    metadata: { client_id: data.client_id, status: data.status }
  })
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/clients/${clientId}`)
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  // Get current project for status comparison
  const { data: currentProject } = await supabase
    .from('projects')
    .select('name, status, client_id')
    .eq('id', id)
    .single()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const due_date = formData.get('due_date') as string
  const priority = formData.get('priority') as string
  const status = formData.get('status') as string
  
  if (!name) {
    return { error: 'Project name is required' }
  }
  
  const oldStatus = currentProject?.status
  const newStatus = status || 'backlog'
  
  const { error } = await supabase
    .from('projects')
    .update({
      name,
      description: description || null,
      due_date: due_date || null,
      priority: priority || 'medium',
      status: newStatus
    })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating project:', error)
    return { error: 'Failed to update project' }
  }
  
  // Log activity - differentiate between status change and general update
  await logActivity({
    activityType: oldStatus !== newStatus ? 'project_status_changed' : 'project_updated',
    entityType: 'project',
    entityId: id,
    entityName: name,
    metadata: { 
      old_status: oldStatus, 
      new_status: newStatus,
      client_id: currentProject?.client_id 
    }
  })
  
  return { success: true }
}

export async function updateProjectStatus(
  projectId: string,
  newStatus: string,
  newPosition: number
) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  // Get current project info before update
  const { data: project } = await supabase
    .from('projects')
    .select('name, status, client_id')
    .eq('id', projectId)
    .single()
  
  const oldStatus = project?.status
  
  const { error } = await supabase
    .from('projects')
    .update({
      status: newStatus,
      position: newPosition
    })
    .eq('id', projectId)
  
  if (error) {
    console.error('Error updating project status:', error)
    return { error: 'Failed to update project' }
  }
  
  // Log activity if status actually changed
  if (oldStatus !== newStatus) {
    await logActivity({
      activityType: 'project_status_changed',
      entityType: 'project',
      entityId: projectId,
      entityName: project?.name,
      metadata: { 
        old_status: oldStatus, 
        new_status: newStatus,
        client_id: project?.client_id 
      }
    })
  }
  
  revalidatePath('/dashboard/projects/board')
  return { success: true }
}

export async function deleteProject(id: string, clientId: string, projectName?: string) {
  const supabase = await createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }
  
  // Get project name if not provided
  let name = projectName
  if (!name) {
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', id)
      .single()
    name = project?.name
  }
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting project:', error)
    return { error: 'Failed to delete project' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'project_deleted',
    entityType: 'project',
    entityId: id,
    entityName: name
  })
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}
