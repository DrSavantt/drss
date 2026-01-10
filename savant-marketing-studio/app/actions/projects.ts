'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (error) {
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
    .is('deleted_at', null)
    .single()
  
  if (error) {
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
    return { error: 'Failed to create project' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'project_created',
    entityType: 'project',
    entityId: data.id,
    entityName: data.name,
    clientId: data.client_id,
    metadata: { client_id: data.client_id, status: data.status }
  })
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/projects/board')
  
  // Return success - don't use redirect() as it throws an error that 
  // gets caught by try-catch blocks in client components
  return { success: true, project: data }
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
    return { error: 'Failed to update project' }
  }
  
  // Log activity - differentiate between status change and general update
  await logActivity({
    activityType: oldStatus !== newStatus ? 'project_status_changed' : 'project_updated',
    entityType: 'project',
    entityId: id,
    entityName: name,
    clientId: currentProject?.client_id,
    metadata: { 
      old_status: oldStatus, 
      new_status: newStatus,
      client_id: currentProject?.client_id 
    }
  })
  
  // Revalidate all relevant paths for UI refresh
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/projects/board')
  if (currentProject?.client_id) {
    revalidatePath(`/dashboard/clients/${currentProject.client_id}`)
  }
  
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
    return { error: 'Failed to update project' }
  }
  
  // Log activity if status actually changed
  if (oldStatus !== newStatus) {
    await logActivity({
      activityType: 'project_status_changed',
      entityType: 'project',
      entityId: projectId,
      entityName: project?.name,
      clientId: project?.client_id,
      metadata: { 
        old_status: oldStatus, 
        new_status: newStatus,
        client_id: project?.client_id 
      }
    })
  }
  
  revalidatePath('/dashboard/projects')
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
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  
  if (error) {
    return { error: 'Failed to delete project' }
  }
  
  // Log activity
  await logActivity({
    activityType: 'project_deleted',
    entityType: 'project',
    entityId: id,
    entityName: name,
    clientId: clientId,
    metadata: { can_restore: true }
  })
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/projects/board')
  revalidatePath('/dashboard/archive')
  return { success: true }
}

export async function restoreProject(id: string) {
  const supabase = await createSupabaseClient()
  if (!supabase) return { error: 'Database not configured' }

  // First, get the project to find client_id for revalidation
  const { data: project } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: null })
    .eq('id', id)

  if (error) {
    console.error('Failed to restore project:', error)
    return { error: 'Failed to restore project' }
  }

  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/projects/board')
  revalidatePath('/dashboard/archive')
  
  // Also revalidate client page if project belongs to a client
  if (project?.client_id) {
    revalidatePath(`/dashboard/clients/${project.client_id}`)
  }
  
  return { success: true }
}

export async function permanentlyDeleteProject(id: string) {
  const supabase = await createSupabaseClient()
  if (!supabase) return { error: 'Database not configured' }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to permanently delete project:', error)
    return { error: 'Failed to permanently delete project' }
  }

  revalidatePath('/dashboard/archive')
  return { success: true }
}

export async function getArchivedProjects() {
  const supabase = await createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients (id, name)
    `)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch archived projects:', error)
    return []
  }

  return data || []
}
