'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Single user credentials
const SINGLE_USER_EMAIL = 'drss.admin@gmail.com'
const SINGLE_USER_PASSWORD = 'drss-admin-2025-secure'

export async function autoLogin() {
  const supabase = await createClient()

  // Try to sign in
  const { error } = await supabase.auth.signInWithPassword({
    email: SINGLE_USER_EMAIL,
    password: SINGLE_USER_PASSWORD,
  })

  // If user doesn't exist, create the account
  if (error?.message.includes('Invalid login credentials')) {
    const { error: signupError } = await supabase.auth.signUp({
      email: SINGLE_USER_EMAIL,
      password: SINGLE_USER_PASSWORD,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation
      }
    })

    if (signupError) {
      return { error: signupError.message }
    }

    // Sign in after creating account
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: SINGLE_USER_EMAIL,
      password: SINGLE_USER_PASSWORD,
    })

    if (loginError) {
      return { error: loginError.message }
    }
  } else if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

