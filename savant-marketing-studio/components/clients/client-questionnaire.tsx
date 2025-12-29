'use client'

import { useState, useEffect } from 'react'
import { Copy, Settings, ExternalLink, Loader2, FileText, AlertCircle, Eye, PencilLine, History } from 'lucide-react'
import { format } from 'date-fns'
import { ResponseViewer } from '@/components/questionnaire/response-viewer'
import { ResponseHistory, ResponseVersion } from '@/components/questionnaire/response-history'
import { ShareQuestionnairePopup } from '@/components/questionnaire/share-questionnaire-popup'
import { EmbeddedQuestionnaireForm } from './embedded-questionnaire-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  const [activeTab, setActiveTab] = useState<TabValue>('view')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<ResponseVersion[]>([])
  const [currentVersion, setCurrentVersion] = useState<ResponseVersion | null>(null)
  const [sections, setSections] = useState<SectionConfig[]>([])
  const [questions, setQuestions] = useState<QuestionWithHelp[]>([])
  const [showCustomizePopup, setShowCustomizePopup] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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

  // Copy questionnaire link
  const handleCopyLink = () => {
    if (!questionnaireToken) {
      toast.error('No questionnaire link available')
      return
    }
    const link = `${window.location.origin}/form/${questionnaireToken}`
    navigator.clipboard.writeText(link)
    toast.success('Questionnaire link copied to clipboard!')
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

  const hasResponses = versions.length > 0
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCopyLink}
            disabled={!questionnaireToken}
            variant="default"
            size="sm"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
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
        <Button
          onClick={() => setShowCustomizePopup(true)}
          variant="outline"
          size="sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Customize Form
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
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
              "px-3 py-1 rounded-full text-sm font-medium",
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

      {/* Tabs for View/Fill/History */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View Responses</span>
            <span className="sm:hidden">View</span>
          </TabsTrigger>
          <TabsTrigger value="fill" className="flex items-center gap-2">
            <PencilLine className="w-4 h-4" />
            <span className="hidden sm:inline">{hasResponses ? 'Edit Form' : 'Fill Out'}</span>
            <span className="sm:hidden">{hasResponses ? 'Edit' : 'Fill'}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        {/* View Tab - Show responses */}
        <TabsContent value="view" className="mt-6">
          {hasResponses && currentVersion?.response_data ? (
            <div className="space-y-4">
              {versions.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Viewing version {currentVersion.version}
                    {currentVersion.is_latest && ' (current)'}
                  </span>
                </div>
              )}
              <ResponseViewer
                responseData={currentVersion.response_data}
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

      {/* Customize Questionnaire Popup */}
      <ShareQuestionnairePopup
        isOpen={showCustomizePopup}
        onClose={() => setShowCustomizePopup(false)}
        clientId={clientId}
        clientName={clientName}
        questionnaireToken={questionnaireToken || ''}
      />
    </div>
  )
}
