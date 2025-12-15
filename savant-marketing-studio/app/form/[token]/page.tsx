import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicQuestionnaireForm } from '@/components/questionnaire/public-questionnaire-form'

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
    .select('id, name, questionnaire_status, intake_responses, user_id')
    .eq('questionnaire_token', token)
    .single()
  
  if (error || !client) {
    return notFound()
  }
  
  // If already completed, show thank you page
  if (client.questionnaire_status === 'completed') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Thank You!
          </h1>
          <p className="text-silver">
            You&apos;ve already completed this questionnaire for <span className="text-foreground font-medium">{client.name}</span>.
          </p>
          <p className="text-silver mt-2 text-sm">
            If you need to make changes, please contact your account manager.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <PublicQuestionnaireForm 
      client={{
        id: client.id,
        name: client.name,
        intake_responses: client.intake_responses,
        user_id: client.user_id
      }} 
      token={token} 
    />
  )
}
