'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, FileText, Eye, PencilLine, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { ResponseViewer } from '@/components/questionnaire/response-viewer'
import { EmbeddedQuestionnaireForm } from '../embedded-questionnaire-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { sanitizeResponses, hasValidResponseData } from '@/lib/utils/safe-render'
import { resetQuestionnaire } from '@/app/actions/questionnaire'

// ============================================================================
// CLIENT QUESTIONNAIRE TAB
// All data pre-fetched server-side. NO loading spinner on tab switch!
// Simplified: Uses clients.intake_responses as single source of truth
// ============================================================================

interface QuestionnaireConfig {
  sections: Array<{
    id: number
    key: string
    title: string
    description?: string
    enabled?: boolean
    sort_order: number
  }>
  questions: Array<{
    id: string
    section_id: number
    question_key: string
    text: string
    type: string
    enabled?: boolean
    sort_order: number
    help?: {
      id?: number
      title?: string | null
      where_to_find?: string[] | null
      how_to_extract?: string[] | null
      good_example?: string | null
      weak_example?: string | null
      quick_tip?: string | null
    } | null
  }>
}

type TabValue = 'view' | 'fill'

interface ClientQuestionnaireTabProps {
  clientId: string
  clientName: string
  config: QuestionnaireConfig
  responseData: Record<string, unknown> | null
  questionnaireStatus?: 'not_started' | 'in_progress' | 'completed' | null
  questionnaireCompletedAt?: string | null
  questionnaireToken?: string | null
}

export function ClientQuestionnaireTab({
  clientId,
  clientName,
  config,
  responseData,
  questionnaireStatus = 'not_started',
  questionnaireCompletedAt,
  questionnaireToken
}: ClientQuestionnaireTabProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>('view')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isResetting, setIsResetting] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  // Copy questionnaire link with contextual message
  const handleCopyLink = () => {
    if (!questionnaireToken) {
      toast.error('No questionnaire link available')
      return
    }
    const link = `${window.location.origin}/form/${questionnaireToken}`
    navigator.clipboard.writeText(link)
    
    if (questionnaireStatus === 'in_progress') {
      toast.success('Resume link copied! Client will continue from their saved progress.')
    } else if (questionnaireStatus === 'completed') {
      toast.success('Link copied! Questionnaire is already completed.')
    } else {
      toast.success('Questionnaire link copied to clipboard!')
    }
  }

  // Handle form completion - refresh data and switch to view tab
  const handleFormComplete = () => {
    setActiveTab('view')
    setRefreshKey(prev => prev + 1)
    router.refresh()
    toast.success('Questionnaire submitted successfully!')
  }

  // Handle questionnaire reset
  const handleReset = async () => {
    setIsResetting(true)
    try {
      const result = await resetQuestionnaire(clientId)
      if (result.success) {
        toast.success('Questionnaire reset successfully')
        setRefreshKey(prev => prev + 1)
        setActiveTab('view')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to reset questionnaire')
      }
    } catch (error) {
      console.error('Reset error:', error)
      toast.error('Failed to reset questionnaire')
    } finally {
      setIsResetting(false)
      setResetDialogOpen(false)
    }
  }

  // Show reset button only when there's something to reset
  const showResetButton = questionnaireStatus === 'in_progress' || questionnaireStatus === 'completed'

  // Transform sections for ResponseViewer
  const transformedSections = config.sections
    .filter(s => s.enabled !== false)
    .map(section => {
      const sectionQuestions = config.questions
        .filter(q => q.section_id === section.id && q.enabled !== false)
        .map(q => ({
          questionKey: q.id,
          questionText: q.text,
          answer: '',
          type: q.type as 'long-text' | 'short-text' | 'multiple-choice' | 'checkbox' | 'file-upload'
        }))

      return {
        sectionKey: section.key,
        sectionTitle: section.title,
        questions: sectionQuestions
      }
    })

  // Check if there are actual responses with content
  const hasResponses = useMemo(() => {
    if (!responseData) return false
    return hasValidResponseData(responseData)
  }, [responseData])
  
  // Sanitize response data to prevent crashes from corrupted data
  const safeResponseData = useMemo(() => {
    if (!responseData) return null
    return sanitizeResponses(responseData)
  }, [responseData])
  
  const isCompleted = questionnaireStatus === 'completed'

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyLink}
              disabled={!questionnaireToken}
              variant="default"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            
            {/* Reset Form Button - only show when there's something to reset */}
            {showResetButton && (
              <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isResetting}
                  >
                    <RotateCcw className={cn("h-4 w-4 mr-2", isResetting && "animate-spin")} />
                    {isResetting ? 'Resetting...' : 'Reset Form'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Questionnaire?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all questionnaire responses for {clientName}. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault()  // Prevent auto-close so async action can complete
                        handleReset()
                      }}
                      disabled={isResetting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isResetting ? 'Resetting...' : 'Reset Form'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Draft Status Message */}
        {questionnaireStatus === 'in_progress' && hasResponses && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
            <span className="font-medium text-foreground">Draft in progress</span>
            <span>•</span>
            <span>Client will continue where they left off when they open the link</span>
          </div>
        )}
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">Questionnaire Status</CardTitle>
              <CardDescription>
                {isCompleted ? (
                  <>Completed on {questionnaireCompletedAt ? format(new Date(questionnaireCompletedAt), 'MMM d, yyyy') : 'N/A'}</>
                ) : hasResponses ? (
                  <>In progress - draft saved</>
                ) : (
                  <>Not started</>
                )}
              </CardDescription>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-medium flex-shrink-0",
              isCompleted 
                ? 'bg-green-500/10 text-green-600' 
                : hasResponses 
                  ? 'bg-yellow-500/10 text-yellow-600'
                  : 'bg-muted text-muted-foreground'
            )}>
              {isCompleted ? 'Completed' : hasResponses ? 'In Progress' : 'Not Started'}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for View/Fill */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>View Responses</span>
          </TabsTrigger>
          <TabsTrigger value="fill" className="flex items-center gap-2">
            <PencilLine className="w-4 h-4" />
            <span>{hasResponses ? 'Edit Form' : 'Fill Out'}</span>
          </TabsTrigger>
        </TabsList>

        {/* View Tab - Show responses */}
        <TabsContent value="view" className="mt-6">
          {hasResponses && safeResponseData ? (
            <ResponseViewer
              responseData={safeResponseData}
              sections={transformedSections}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Responses Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {clientName} hasn&apos;t filled out the questionnaire yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Copy the link above and share it with your client to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fill Tab - Embedded form */}
        <TabsContent value="fill" className="mt-6">
          <EmbeddedQuestionnaireForm
            key={refreshKey}
            clientId={clientId}
            clientName={clientName}
            userId=""
            initialData={responseData as unknown as import('@/lib/questionnaire/types').QuestionnaireData}
            onComplete={handleFormComplete}
            onCancel={() => setActiveTab('view')}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

