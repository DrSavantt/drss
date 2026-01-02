import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// ============================================
// CLIENT QUESTIONNAIRE CUSTOMIZE PAGE - DYNAMIC IMPORT
// dnd-kit (~30kb) only loads when this page is visited
// ============================================

const QuestionnaireSettings = dynamic(
  () => import('@/components/settings/questionnaire-settings').then(mod => ({ default: mod.QuestionnaireSettings })),
  {
    loading: () => (
      <div className="space-y-6">
        {/* Client Mode Banner */}
        <div className="flex items-center gap-3 p-4 rounded-lg border border-blue-500/50 bg-blue-500/10">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 flex-1 max-w-md" />
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        
        {/* Sections List */}
        <div className="rounded-lg border border-border bg-card">
          <div className="p-6 border-b border-border">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="p-6 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-border">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
    // Note: ssr: false removed - this is a Server Component that needs SSR
    // The dynamic import still provides code splitting benefits
  }
)

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
