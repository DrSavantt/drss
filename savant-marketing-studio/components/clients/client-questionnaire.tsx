'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Settings, ExternalLink, Loader2, FileText, AlertCircle, Eye, PencilLine, History, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ResponseViewer } from '@/components/questionnaire/response-viewer'
import { ResponseHistory, ResponseVersion } from '@/components/questionnaire/response-history'
import { EmbeddedQuestionnaireForm } from './embedded-questionnaire-form'
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
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { sanitizeResponses, hasValidResponseData } from '@/lib/utils/safe-render'

interface ClientQuestionnaireProps {
  clientId: string
  clientName: string
  questionnaireStatus?: 'not_started' | 'in_progress' | 'completed' | null
  questionnaireCompletedAt?: string | null
  questionnaireToken?: string | null
  currentUserId?: string // Optional - EmbeddedQuestionnaireForm will fetch if needed
}

interface QuestionConfig {
  id: string
  section_id: number
  question_key: string
  text: string
  type: string
  enabled: boolean
}

interface SectionConfig {
  id: number
  key: string
  title: string
  enabled: boolean
}

interface QuestionHelpContent {
  id?: number
  title?: string | null
  where_to_find?: string[] | null
  how_to_extract?: string[] | null
  good_example?: string | null
  weak_example?: string | null
  quick_tip?: string | null
}

interface QuestionWithHelp extends QuestionConfig {
  help?: QuestionHelpContent
}

type TabValue = 'view' | 'fill' | 'history'

export function ClientQuestionnaire({ 
  clientId, 
  clientName,
  questionnaireStatus = 'not_started',
  questionnaireCompletedAt,
  questionnaireToken,
  currentUserId = ''
}: ClientQuestionnaireProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>('view')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<ResponseVersion[]>([])
  const [currentVersion, setCurrentVersion] = useState<ResponseVersion | null>(null)
  const [sections, setSections] = useState<SectionConfig[]>([])
  const [questions, setQuestions] = useState<QuestionWithHelp[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Delete draft state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch response versions and config
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch questionnaire config (sections and questions structure)
        const configRes = await fetch('/api/questionnaire-config')
        if (!configRes.ok) throw new Error('Failed to fetch config')
        const configData = await configRes.json()
        
        setSections(configData.sections || [])
        setQuestions(configData.questions || [])
        
        // Fetch all response versions (might be empty if not filled out yet)
        const versionsRes = await fetch(`/api/questionnaire-response/${clientId}`)
        if (versionsRes.ok) {
          const versionsData = await versionsRes.json()
          setVersions(versionsData.data || [])
          
          // Set current version to latest
          const latest = versionsData.data?.find((v: ResponseVersion) => v.is_latest)
          setCurrentVersion(latest || null)
        }
        
      } catch (err) {
        console.error('Error fetching questionnaire data:', err)
        setError('Failed to load questionnaire data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [clientId, refreshKey])

  // Calculate progress from current responses
  const calculateProgress = (): number => {
    if (!currentVersion?.response_data) return 0
    
    const responseData = currentVersion.response_data
    
    // Handle edge case: empty response_data object
    if (typeof responseData !== 'object' || Object.keys(responseData).length === 0) {
      return 0
    }
    
    let filled = 0
    let total = 0
    
    // Iterate through sections and their responses
    Object.values(responseData).forEach((section: any) => {
      if (typeof section === 'object' && section !== null && !Array.isArray(section)) {
        Object.values(section).forEach((answer: any) => {
          total++
          // Count as filled if answer has content
          if (answer && answer !== '' && (Array.isArray(answer) ? answer.length > 0 : true)) {
            filled++
          }
        })
      }
    })
    
    return total > 0 ? Math.round((filled / total) * 100) : 0
  }

  // Copy questionnaire link with contextual message
  const handleCopyLink = () => {
    if (!questionnaireToken) {
      toast.error('No questionnaire link available')
      return
    }
    const link = `${window.location.origin}/form/${questionnaireToken}`
    navigator.clipboard.writeText(link)
    
    if (questionnaireStatus === 'in_progress') {
      toast.success('Resume link copied! Client will continue from their saved progress.', {
        description: `Progress: ${calculateProgress()}% complete`
      })
    } else if (questionnaireStatus === 'completed') {
      toast.success('Link copied! Questionnaire is already completed.')
    } else {
      toast.success('Questionnaire link copied to clipboard!')
    }
  }

  // View a specific version
  const handleViewVersion = (version: ResponseVersion) => {
    setCurrentVersion(version)
  }

  // Handle form completion - refresh data and switch to view tab
  const handleFormComplete = () => {
    setActiveTab('view')
    setRefreshKey(prev => prev + 1)
    toast.success('Questionnaire submitted successfully!')
  }

  // Handle delete draft
  const handleDeleteDraft = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/questionnaire-response/${clientId}/draft`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('Draft deleted successfully')
        setShowDeleteConfirm(false)
        // Refresh the page data
        router.refresh()
        setRefreshKey(prev => prev + 1)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete draft')
      }
    } catch (error) {
      console.error('Delete draft error:', error)
      toast.error('Failed to delete draft')
    } finally {
      setIsDeleting(false)
    }
  }

  // Transform sections for ResponseViewer
  const transformedSections = sections
    .filter(s => s.enabled)
    .map(section => {
      const sectionQuestions = questions
        .filter(q => q.section_id === section.id && q.enabled)
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

  // Check if there are actual responses with content (not just empty objects)
  const hasResponses = useMemo(() => {
    if (versions.length === 0) return false
    if (!currentVersion?.response_data) return false
    
    // Use the safe validation function
    return hasValidResponseData(currentVersion.response_data)
  }, [versions, currentVersion])
  
  // Sanitize response data to prevent crashes from corrupted data
  const safeResponseData = useMemo(() => {
    if (!currentVersion?.response_data) return null
    return sanitizeResponses(currentVersion.response_data)
  }, [currentVersion])
  
  const isCompleted = questionnaireStatus === 'completed'

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading questionnaire data...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive">{error}</p>
        <button 
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleCopyLink}
              disabled={!questionnaireToken}
              variant="default"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              {questionnaireStatus === 'in_progress' ? 'Copy Resume Link' : 'Copy Link'}
            </Button>
            {questionnaireToken && (
              <Button
                onClick={() => window.open(`/form/${questionnaireToken}`, '_blank')}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Public Form
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Delete Draft button - show when there are responses or status is in_progress */}
            {(hasResponses || questionnaireStatus === 'in_progress') && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Draft
              </Button>
            )}
            <Button
              onClick={() => router.push(`/dashboard/clients/${clientId}/questionnaire/customize`)}
              variant="outline"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize Form
            </Button>
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
          
          {/* Progress bar for in_progress status */}
          {questionnaireStatus === 'in_progress' && hasResponses && (
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{calculateProgress()}% complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Tabs for View/Fill/History */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>View Responses</span>
          </TabsTrigger>
          <TabsTrigger value="fill" className="flex items-center gap-2">
            <PencilLine className="w-4 h-4" />
            <span>{hasResponses ? 'Edit Form' : 'Fill Out'}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        {/* View Tab - Show responses */}
        <TabsContent value="view" className="mt-6">
          {hasResponses && safeResponseData ? (
            <div className="space-y-4">
              {versions.length > 1 && currentVersion && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Viewing version {currentVersion.version}
                    {currentVersion.is_latest && ' (current)'}
                  </span>
                </div>
              )}
              <ResponseViewer
                responseData={safeResponseData}
                sections={transformedSections}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Responses Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {clientName} hasn&apos;t filled out the questionnaire yet.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button onClick={() => setActiveTab('fill')}>
                    <PencilLine className="w-4 h-4 mr-2" />
                    Fill Out Now
                  </Button>
                  {questionnaireToken && (
                    <Button variant="outline" onClick={handleCopyLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link for Client
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fill Tab - Embedded form */}
        <TabsContent value="fill" className="mt-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <EmbeddedQuestionnaireForm
            clientId={clientId}
            clientName={clientName}
            userId={currentUserId}
            initialData={currentVersion?.response_data as unknown as import('@/lib/questionnaire/types').QuestionnaireData}
            onComplete={handleFormComplete}
            onCancel={() => setActiveTab('view')}
          />
        </TabsContent>

        {/* History Tab - Version history */}
        <TabsContent value="history" className="mt-6">
          {versions.length > 0 ? (
            <ResponseHistory
              versions={versions}
              currentVersionId={currentVersion?.id}
              onViewVersion={(version) => {
                handleViewVersion(version)
                setActiveTab('view')
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                <p className="text-muted-foreground">
                  Response history will appear here once the questionnaire is filled out.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Draft Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all saved responses for this questionnaire.
              The client will have to start over from the beginning. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDraft}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Draft'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
