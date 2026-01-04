'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Moon, 
  Sun,
  Loader2,
  Building2,
  Circle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SectionRenderer } from '@/components/questionnaire/section-renderer'
import { submitPublicQuestionnaire, savePublicQuestionnaireProgress } from '@/app/actions/questionnaire'
import { cn } from '@/lib/utils'
import type { QuestionConfig, SectionConfig } from '@/lib/questionnaire/questions-config'
import { QuestionnaireData, EMPTY_QUESTIONNAIRE_DATA, UploadedFile } from '@/lib/questionnaire/types'
import { toast } from 'sonner'

// Types for database format
interface DatabaseSection {
  id: number
  key: string
  title: string
  description: string | null
  estimated_minutes: number
  sort_order: number
  enabled: boolean
}

// Help content structure (embedded in questions.help_content JSONB column)
interface HelpContent {
  title: string | null
  where_to_find: string[] | null
  how_to_extract: string[] | null
  good_example: string | null
  weak_example: string | null
  quick_tip: string | null
}

interface DatabaseQuestion {
  id: string
  section_id: number
  question_key: string
  sort_order: number
  text: string
  type: string
  required: boolean
  enabled: boolean
  min_length: number | null
  max_length: number | null
  placeholder: string | null
  options: any
  conditional_on: any
  accepted_file_types: string[] | null
  max_file_size: number | null
  max_files: number | null
  file_description: string | null
  help?: HelpContent | null  // Now uses JSONB structure, not separate table
  help_content?: HelpContent | null  // Alternative name from DB
}

interface Client {
  id: string
  name: string
  email?: string
  intake_responses?: any
  user_id: string
}

interface PublicQuestionnaireFormProps {
  client: Client
  token: string
  sections: DatabaseSection[]
  questions: DatabaseQuestion[]
}

export function PublicQuestionnaireForm({ 
  client, 
  token, 
  sections,
  questions 
}: PublicQuestionnaireFormProps) {
  const router = useRouter()
  
  // Theme state (independent of app theme)
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  // Form state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [formData, setFormData] = useState<QuestionnaireData>(EMPTY_QUESTIONNAIRE_DATA)
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Transform database format to component format
  const transformedSections: SectionConfig[] = useMemo(() => sections.map(s => ({
    id: s.id,
    key: s.key,
    title: s.title,
    description: s.description || '',
    estimatedMinutes: s.estimated_minutes || 5,
    enabled: s.enabled
  })), [sections])

  const transformedQuestions: QuestionConfig[] = useMemo(() => questions.map(q => ({
    id: q.id,
    key: q.question_key,
    sectionId: q.section_id,
    order: q.sort_order,
    text: q.text,
    type: q.type as QuestionConfig['type'],
    required: q.required,
    enabled: q.enabled,
    minLength: q.min_length ?? undefined,
    maxLength: q.max_length ?? undefined,
    placeholder: q.placeholder ?? undefined,
    options: q.options ?? undefined,
    conditionalOn: q.conditional_on ?? undefined,
    acceptedFileTypes: q.accepted_file_types ?? undefined,
    maxFileSize: q.max_file_size ?? undefined,
    maxFiles: q.max_files ?? undefined,
    fileDescription: q.file_description ?? undefined,
    helpTitle: q.help?.title ?? undefined,
    helpWhereToFind: q.help?.where_to_find ?? undefined,
    helpHowToExtract: q.help?.how_to_extract ?? undefined,
    helpGoodExample: q.help?.good_example ?? undefined,
    helpWeakExample: q.help?.weak_example ?? undefined,
    helpQuickTip: q.help?.quick_tip ?? undefined,
  })), [questions])

  const currentSection = transformedSections[currentSectionIndex]
  const totalSections = transformedSections.length

  // Get questions for current section
  const currentSectionQuestions = useMemo(() => 
    transformedQuestions.filter(q => q.sectionId === currentSection?.id),
    [transformedQuestions, currentSection]
  )

  // Calculate progress
  const totalRequiredQuestions = transformedQuestions.filter(q => q.required).length
  const answeredRequiredQuestions = Array.from(completedQuestions).filter(key => {
    const question = transformedQuestions.find(q => q.key === key)
    return question?.required
  }).length
  
  const progressPercent = totalRequiredQuestions > 0 
    ? Math.round((answeredRequiredQuestions / totalRequiredQuestions) * 100) 
    : 0

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`questionnaire_${token}`)
    if (saved) {
      try {
        const { formData: savedData, completedQuestions: savedCompleted, currentSection } = JSON.parse(saved)
        if (savedData) setFormData(savedData)
        if (savedCompleted) setCompletedQuestions(new Set(savedCompleted))
        if (typeof currentSection === 'number' && currentSection < totalSections) {
          setCurrentSectionIndex(currentSection)
        }
      } catch (e) {
        console.error('Failed to load saved progress:', e)
      }
    }
  }, [token, totalSections])

  // Auto-save to localStorage
  useEffect(() => {
    const saveData = {
      formData,
      completedQuestions: Array.from(completedQuestions),
      currentSection: currentSectionIndex
    }
    localStorage.setItem(`questionnaire_${token}`, JSON.stringify(saveData))
  }, [formData, completedQuestions, currentSectionIndex, token])

  // Auto-save to server (debounced)
  useEffect(() => {
    if (Object.keys(formData).length === 0) return
    
    const timeoutId = setTimeout(async () => {
      setIsSaving(true)
      try {
        await savePublicQuestionnaireProgress(token, formData)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Failed to save progress:', error)
      } finally {
        setIsSaving(false)
      }
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [formData, token])

  // Update question answer
  const updateQuestion = useCallback((questionKey: string, value: string | string[] | UploadedFile[]) => {
    const question = transformedQuestions.find(q => q.key === questionKey || q.id === questionKey)
    if (!question) return

    // Find section key for this question
    const section = transformedSections.find(s => s.id === question.sectionId)
    if (!section) return

    setFormData(prev => {
      const sectionData = (prev as any)[section.key] || {}
      return {
        ...prev,
        [section.key]: {
          ...sectionData,
          [question.id]: value
        }
      } as QuestionnaireData
    })
  }, [transformedQuestions, transformedSections])

  // Mark question as completed
  const markQuestionCompleted = useCallback((questionKey: string) => {
    setCompletedQuestions(prev => {
      const next = new Set(prev)
      next.add(questionKey)
      return next
    })
  }, [])

  // Navigation
  const goToNextSection = () => {
    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Submit questionnaire
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const result = await submitPublicQuestionnaire(token, formData)
      
      if (result.success) {
        // Clear localStorage
        localStorage.removeItem(`questionnaire_${token}`)
        
        // Redirect to completion page
        router.push(`/form/${token}/complete`)
      } else {
        toast.error(result.error || 'Failed to submit questionnaire')
      }
    } catch (error) {
      console.error('Failed to submit:', error)
      toast.error('Failed to submit questionnaire. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLastSection = currentSectionIndex === totalSections - 1
  const isFirstSection = currentSectionIndex === 0

  // Create a mock config object for SectionRenderer
  const mockConfig = useMemo(() => ({
    sections: transformedSections,
    questions: transformedQuestions,
    isLoading: false,
    isLoaded: true,
    error: null,
    getEnabledSections: () => transformedSections,
    getSectionById: (id: number) => transformedSections.find(s => s.id === id),
    getSectionByKey: (key: string) => transformedSections.find(s => s.key === key),
    getEnabledQuestions: () => transformedQuestions,
    getQuestionsForSection: (sectionId: number) => 
      transformedQuestions.filter(q => q.sectionId === sectionId),
    getQuestionById: (id: string) => 
      transformedQuestions.find(q => q.id === id),
    getQuestionByKey: (key: string) => 
      transformedQuestions.find(q => q.key === key),
    shouldShowQuestion: (questionId: string, data: Record<string, any>) => {
      const question = transformedQuestions.find(q => q.id === questionId)
      if (!question?.conditionalOn) return true
      const { questionId: depId, equals, notEquals } = question.conditionalOn
      
      // Flatten form data to check conditions
      const flatData: Record<string, any> = {}
      Object.values(data).forEach(sectionData => {
        if (typeof sectionData === 'object' && sectionData !== null) {
          Object.assign(flatData, sectionData)
        }
      })
      
      const depValue = flatData[depId]
      if (equals !== undefined) return depValue === equals
      if (notEquals !== undefined) return depValue !== notEquals && depValue !== '' && depValue !== undefined
      return true
    },
    getNextEnabledSectionId: (currentId: number) => {
      const currentIdx = transformedSections.findIndex(s => s.id === currentId)
      return currentIdx < transformedSections.length - 1 
        ? transformedSections[currentIdx + 1].id 
        : null
    },
    getPreviousEnabledSectionId: (currentId: number) => {
      const currentIdx = transformedSections.findIndex(s => s.id === currentId)
      return currentIdx > 0 
        ? transformedSections[currentIdx - 1].id 
        : null
    },
    isLastEnabledSection: (sectionId: number) => 
      transformedSections[transformedSections.length - 1]?.id === sectionId,
    isFirstEnabledSection: (sectionId: number) => 
      transformedSections[0]?.id === sectionId,
    refresh: async () => {}
  }), [transformedSections, transformedQuestions])

  // Convert formData to flat structure for SectionRenderer
  const flatFormData = useMemo(() => {
    const flat: Record<string, string | string[] | UploadedFile[]> = {}
    Object.values(formData).forEach(sectionData => {
      if (typeof sectionData === 'object' && sectionData !== null) {
        Object.entries(sectionData as Record<string, any>).forEach(([key, value]) => {
          flat[key] = value as string | string[] | UploadedFile[]
        })
      }
    })
    return flat
  }, [formData])

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 pb-24",
      isDarkMode ? "dark bg-background" : "bg-white"
    )}>
      {/* Apply dark mode class globally for this form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Client Questionnaire</h1>
              <p className="text-sm text-muted-foreground">{client.name}</p>
            </div>
          </div>
          
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="rounded-full"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </header>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Section {currentSectionIndex + 1} of {totalSections}
            </span>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span className="text-muted-foreground text-xs">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <span className="text-muted-foreground">
                {progressPercent}% complete
              </span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Section navigation pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {transformedSections.map((section, index) => {
            const sectionQuestions = transformedQuestions.filter(q => q.sectionId === section.id && q.required)
            const answeredInSection = sectionQuestions.filter(q => 
              completedQuestions.has(q.key)
            ).length
            const allAnswered = answeredInSection === sectionQuestions.length && sectionQuestions.length > 0
            
            return (
              <button
                key={section.id}
                onClick={() => setCurrentSectionIndex(index)}
                className={cn(
                  "relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  index === currentSectionIndex
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : allAnswered
                      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {allAnswered && index !== currentSectionIndex && (
                  <Check className="h-3 w-3 inline-block mr-1" />
                )}
                {section.title}
              </button>
            )
          })}
        </div>

        {/* Current section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentSection && (
              <SectionRenderer
                section={currentSection}
                formData={flatFormData}
                updateQuestion={updateQuestion}
                markQuestionCompleted={markQuestionCompleted}
                completedQuestions={completedQuestions}
                config={mockConfig}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border py-4 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousSection}
              disabled={isFirstSection}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {isSaving && (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span className="flex items-center gap-1.5 text-green-500">
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
              {!isSaving && !lastSaved && (
                <span className="flex items-center gap-1.5">
                  <Circle className="h-2 w-2 fill-current" />
                  Draft
                </span>
              )}
            </div>

            {isLastSection ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={goToNextSection}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicQuestionnaireForm
