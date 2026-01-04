import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PublicFormWrapper } from '@/components/questionnaire/public-form-wrapper'
import { getSectionsForClient, getQuestionsForClient } from '@/app/actions/questionnaire-config'

// Force dynamic - each token needs fresh config and response data
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function PublicFormPage({ params }: PageProps) {
  const { token } = await params
  
  const supabase = await createClient()
  
  if (!supabase) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Service Unavailable
          </h1>
          <p className="text-silver">
            Please try again later.
          </p>
        </div>
      </div>
    )
  }
  
  // Look up client by token (no auth required for public form)
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name, email, questionnaire_status, intake_responses, user_id')
    .eq('questionnaire_token', token)
    .single()
  
  if (error || !client) {
    return notFound()
  }
  
  // If already completed, redirect to completion page
  if (client.questionnaire_status === 'completed') {
    redirect(`/form/${token}/complete`)
  }
  
  // Load existing responses from clients.intake_responses
  // Data format: { sections: {...} } or raw { avatar_definition: {...}, ... }
  let existingResponses: Record<string, unknown> | null = null
  
  if (client.intake_responses) {
    const intakeData = client.intake_responses as Record<string, unknown>
    
    if (intakeData.sections) {
      // It's wrapped in { version, sections: {...} } format - unwrap it
      existingResponses = intakeData.sections as Record<string, unknown>
    } else if (intakeData.avatar_definition || intakeData.dream_outcome) {
      // It's already in raw format
      existingResponses = intakeData
    }
  }
  
  // Fetch questionnaire config WITH CLIENT-SPECIFIC OVERRIDES APPLIED
  // This ensures disabled sections/questions for this client are excluded
  const [sections, questions] = await Promise.all([
    getSectionsForClient(client.id),
    getQuestionsForClient(client.id)
  ])
  
  // Filter to enabled only (after overrides are applied)
  const enabledSections = sections
    .filter(s => s.enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
  
  const enabledQuestions = questions
    .filter(q => q.enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
  
  return (
    <PublicFormWrapper 
      client={{
        id: client.id,
        name: client.name,
        email: client.email,
        intake_responses: existingResponses, // Pass properly formatted data
        user_id: client.user_id
      }} 
      token={token}
      sections={enabledSections}
      questions={enabledQuestions}
    />
  )
}
