'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Load credentials from environment variables (never hardcode)
const SINGLE_USER_EMAIL = process.env.ADMIN_EMAIL
const SINGLE_USER_PASSWORD = process.env.ADMIN_PASSWORD

export async function autoLogin() {
  // Validate credentials exist before attempting login
  if (!SINGLE_USER_EMAIL || !SINGLE_USER_PASSWORD) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables')
    return { error: 'Server configuration error. Admin credentials not configured.' }
  }
  const supabase = await createClient()

  if (!supabase) {
    return { error: 'Database connection not configured. Please set Supabase environment variables.' }
  }

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
        emailRedirectTo: undefined, // Disable email confirmation if possible
      }
    })

    if (signupError) {
      console.error('Signup error:', signupError)
      return { error: `Signup failed: ${signupError.message}` }
    }

    // Sign in after creating account
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: SINGLE_USER_EMAIL,
      password: SINGLE_USER_PASSWORD,
    })

    if (loginError) {
      console.error('Login after signup error:', loginError)
      return { error: `Login failed after signup: ${loginError.message}` }
    }
  } else if (error) {
    console.error('Initial login error:', error)
    return { error: `Login failed: ${error.message}` }
  }

  // Success - revalidate and redirect
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  if (supabase) {
    await supabase.auth.signOut()
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}

