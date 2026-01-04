// Server Component - NO 'use client'
// Fetches ALL tab data server-side in ONE parallel request
// Uses ISR for caching at the page level

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientDetailContent } from '@/components/clients/client-detail-content'
import { safeText } from '@/lib/utils/safe-render'

// ISR: Cache page for 30 seconds, then revalidate in background
export const revalidate = 30

interface ClientPageProps {
  params: Promise<{ id: string }>
}

// Loading skeleton for Suspense
function ClientDetailSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back link skeleton */}
      <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
      
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-muted/30 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-muted/30 rounded animate-pulse" />
          <div className="h-9 w-9 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Tabs skeleton */}
      <div className="h-10 w-full max-w-md bg-muted/30 rounded animate-pulse" />
      
      {/* Content skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// Async component that fetches client-specific data
async function ClientDetailLoader({ id }: { id: string }) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Database connection failed')
  }

  // Fetch ALL data for ALL tabs in ONE parallel request
  const [
    { data: client, error: clientError },
    { data: projects },
    { data: content },
    { data: activityLog },
    { data: sections },
    { data: questions },
    { data: aiExecutions },
    { count: projectCount },
    { count: contentCount }
  ] = await Promise.all([
    // Client details (includes intake_responses for questionnaire)
    supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    
    // Projects for this client only
    supabase
      .from('projects')
      .select('*')
      .eq('client_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    
    // Content for this client only
    supabase
      .from('content_assets')
      .select('*')
      .eq('client_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    
    // Activity log for this client (recent 20)
    supabase
      .from('activity_log')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    
    // Questionnaire sections (static, same for all clients)
    supabase
      .from('questionnaire_sections')
      .select('*')
      .order('sort_order'),
    
    // Questionnaire questions (help is embedded in help_content column)
    supabase
      .from('questionnaire_questions')
      .select('*')
      .order('section_id, sort_order'),
    
    // AI executions for this client
    supabase
      .from('ai_executions')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    
    // Project count
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id)
      .is('deleted_at', null),
    
    // Content count  
    supabase
      .from('content_assets')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id)
      .is('deleted_at', null)
  ])

  // Handle not found
  if (clientError || !client) {
    notFound()
  }

  // Build questions with help data (help is embedded in help_content column)
  const questionsWithHelp = (questions || []).map(q => ({
    ...q,
    help: q.help_content || null
  }))

  // Build questionnaire config object
  const questionnaireConfig = {
    sections: sections || [],
    questions: questionsWithHelp
  }

  // Get response data from clients.intake_responses (single source of truth)
  // Format: { sections: {...} } or raw { avatar_definition: {...}, ... }
  let responseData = null
  if (client.intake_responses) {
    const intakeData = client.intake_responses as Record<string, unknown>
    if (intakeData.sections) {
      // Wrapped format - unwrap
      responseData = intakeData.sections
    } else if (intakeData.avatar_definition || intakeData.dream_outcome) {
      // Raw format
      responseData = intakeData
    }
  }

  // Calculate AI stats
  const aiCalls = aiExecutions?.length || 0
  const aiSpend = aiExecutions?.reduce((sum, gen) => sum + (Number(gen.total_cost_usd) || 0), 0) || 0

  // Map client status
  let status: 'onboarded' | 'onboarding' | 'new' = 'new'
  if (client.questionnaire_status === 'completed') {
    status = 'onboarded'
  } else if (client.questionnaire_status === 'in_progress') {
    status = 'onboarding'
  }

  // Extract brand info from responses (use safeText to handle empty objects {})
  const brandVoice = safeText(client.intake_responses?.brand_voice) || 
                     safeText(client.brand_data?.voice) || 
                     'Not yet defined'
  const targetAudience = safeText(client.intake_responses?.target_audience) || 
                        safeText(client.brand_data?.target_audience) || 
                        'Not yet defined'

  // Build the full client object with computed fields
  const clientWithCounts = {
    ...client,
    status,
    projectCount: projectCount || 0,
    contentCount: contentCount || 0,
    aiCalls,
    aiSpend: Math.round(aiSpend * 100) / 100,
    brandVoice,
    targetAudience
  }

  return (
    <ClientDetailContent
      client={clientWithCounts}
      projects={projects || []}
      content={content || []}
      activity={activityLog || []}
      questionnaireConfig={questionnaireConfig}
      questionnaireResponseData={responseData}
      aiExecutions={aiExecutions || []}
    />
  )
}

// Main page with streaming
export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params
  
  return (
    <Suspense fallback={<ClientDetailSkeleton />}>
      <ClientDetailLoader id={id} />
    </Suspense>
  )
}
