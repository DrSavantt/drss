import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicQuestionnaireForm } from '@/components/questionnaire/public-questionnaire-form'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function PublicFormPage({ params }: PageProps) {
  const { token } = await params
  
  // #region agent log
  console.log('[FORM PAGE] Entry:', { 
    token, 
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    timestamp: new Date().toISOString()
  })
  fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:10',message:'Form page entry',data:{token:token,hasSupabaseUrl:!!process.env.NEXT_PUBLIC_SUPABASE_URL,hasSupabaseKey:!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3',runId:'post-fix'})}).catch(()=>{});
  // #endregion
  
  const supabase = await createClient()
  
  if (!supabase) {
    // #region agent log
    console.log('[FORM PAGE] Supabase client is null', { token })
    fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:17',message:'Supabase client is null',data:{token:token},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
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
  
  // #region agent log
  console.log('[FORM PAGE] Client lookup result:', { 
    token, 
    hasClient: !!client, 
    hasError: !!error, 
    errorMsg: error?.message,
    errorCode: error?.code,
    clientId: client?.id 
  })
  fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:36',message:'Client lookup result',data:{token:token,hasClient:!!client,hasError:!!error,errorMsg:error?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  
  if (error || !client) {
    // #region agent log
    console.log('[FORM PAGE] Client not found - returning notFound()', { token, error: error?.message })
    fetch('http://127.0.0.1:7243/ingest/de6f83dd-b5e0-4c9a-99d4-d76568bc937c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:42',message:'Client not found - returning notFound()',data:{token:token,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
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
