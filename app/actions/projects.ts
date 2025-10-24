'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getProjects(clientId: string) {
  const supabase = await createSupabaseClient()
  
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
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/clients/${clientId}`)
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createSupabaseClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const due_date = formData.get('due_date') as string
  const priority = formData.get('priority') as string
  const status = formData.get('status') as string
  
  if (!name) {
    return { error: 'Project name is required' }
  }
  
  const { error } = await supabase
    .from('projects')
    .update({
      name,
      description: description || null,
      due_date: due_date || null,
      priority: priority || 'medium',
      status: status || 'backlog'
    })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating project:', error)
    return { error: 'Failed to update project' }
  }
  
  return { success: true }
}

export async function updateProjectStatus(
  projectId: string,
  newStatus: string,
  newPosition: number
) {
  const supabase = await createSupabaseClient()
  
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
  
  revalidatePath('/dashboard/projects/board')
  return { success: true }
}

export async function deleteProject(id: string, clientId: string) {
  const supabase = await createSupabaseClient()
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting project:', error)
    return { error: 'Failed to delete project' }
  }
  
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}
