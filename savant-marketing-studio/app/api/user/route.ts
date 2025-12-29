import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  if (!supabase) {
    return NextResponse.json({ email: null }, { status: 401 })
  }
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ email: null }, { status: 401 })
  }

  return NextResponse.json({ 
    email: user.email,
    user_metadata: user.user_metadata,
  })
}

