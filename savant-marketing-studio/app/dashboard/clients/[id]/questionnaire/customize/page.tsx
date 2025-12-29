import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QuestionnaireSettings } from '@/components/settings/questionnaire-settings'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientQuestionnaireCustomizePage({ params }: PageProps) {
  const { id: clientId } = await params
  const supabase = await createClient()

  if (!supabase) {
    notFound()
  }

  // Verify client exists and user has access
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single()

  if (error || !client) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <Link href={`/dashboard/clients/${clientId}`}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {client.name}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Customize Questionnaire</h1>
        <p className="text-muted-foreground mt-2">
          Customize questionnaire settings for <span className="font-medium text-foreground">{client.name}</span>. 
          Changes here override the global settings for this client only.
        </p>
      </div>
      
      <QuestionnaireSettings 
        clientId={clientId}
        clientName={client.name}
        mode="client"
      />
    </div>
  )
}

