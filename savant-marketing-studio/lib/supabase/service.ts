/**
 * Service Client for Static Data
 * 
 * Creates a Supabase client WITHOUT cookie handling.
 * Use this ONLY for truly static/public data that doesn't need user auth.
 * 
 * For authenticated queries, use the regular createClient() from ./server
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceClient() {
  // Check if env vars exist
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables')
    return null
  }

  // Create client without auth context - for public/static data only
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

