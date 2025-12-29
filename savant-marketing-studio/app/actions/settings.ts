'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient()
  
  if (!supabase) {
    return { error: 'Database connection not configured' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const displayName = formData.get('displayName') as string
  
  if (!displayName || !displayName.trim()) {
    return { error: 'Display name is required' }
  }
  
  // Store in user metadata
  const { error } = await supabase.auth.updateUser({
    data: { display_name: displayName }
  })
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/settings')
  return { success: true, message: 'Profile updated successfully' }
}

