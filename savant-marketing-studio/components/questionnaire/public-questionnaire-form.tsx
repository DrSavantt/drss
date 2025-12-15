'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProgressStepper } from '@/components/questionnaire/navigation/progress-stepper'
import { QuestionnaireData, EMPTY_QUESTIONNAIRE_DATA, FormStatus, UploadedFile } from '@/lib/questionnaire/types'
import { submitPublicQuestionnaire, savePublicQuestionnaireProgress } from '@/app/actions/questionnaire'
import { UseQuestionnaireFormReturn } from '@/lib/questionnaire/use-questionnaire-form'

// Import all 8 section components
import AvatarDefinitionSection from '@/components/questionnaire/sections/avatar-definition-section'
import DreamOutcomeSection from '@/components/questionnaire/sections/dream-outcome-section'
import ProblemsObstaclesSection from '@/components/questionnaire/sections/problems-obstacles-section'
import SolutionMethodologySection from '@/components/questionnaire/sections/solution-methodology-section'
import BrandVoiceSection from '@/components/questionnaire/sections/brand-voice-section'
import ProofTransformationSection from '@/components/questionnaire/sections/proof-transformation-section'
import FaithIntegrationSection from '@/components/questionnaire/sections/faith-integration-section'
import BusinessMetricsSection from '@/components/questionnaire/sections/business-metrics-section'
import { QuestionnaireReview } from '@/components/questionnaire/review'

interface PublicQuestionnaireFormProps {
  client: { 
    id: string
    name: string
    intake_responses: unknown
    user_id: string
  }
  token: string
}

export function PublicQuestionnaireForm({ client, token }: PublicQuestionnaireFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState(1)
  const [showReview, setShowReview] = useState(false)
  const [formData, setFormData] = useState<QuestionnaireData>(EMPTY_QUESTIONNAIRE_DATA)
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set())
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')

  // Initialize with existing data if available
  useEffect(() => {
    if (client.intake_responses) {
      const responses = client.intake_responses as { sections?: QuestionnaireData }
      if (responses.sections) {
        setFormData(responses.sections)
        // Mark completed questions
        const completed = new Set<string>()
        const checkSection = (sectionData: Record<string, unknown>) => {
          Object.entries(sectionData).forEach(([key, value]) => {
            const match = key.match(/^(q\d+)_/)
            if (match) {
              const questionId = match[1]
              if (value && (typeof value === 'string' ? value.trim() !== '' : Array.isArray(value) ? value.length > 0 : false)) {
                completed.add(questionId)
              }
            }
          })
        }
        Object.values(responses.sections).forEach(section => {
          if (section && typeof section === 'object') {
            checkSection(section as Record<string, unknown>)
          }
        })
        setCompletedQuestions(completed)
      }
    }
  }, [client.intake_responses])

  // Auto-save to localStorage
  useEffect(() => {
    const key = `public_questionnaire_${token}`
    localStorage.setItem(key, JSON.stringify({ formData, completedQuestions: Array.from(completedQuestions), currentSection }))
  }, [formData, completedQuestions, currentSection, token])

  // Restore from localStorage on mount
  useEffect(() => {
    const key = `public_questionnaire_${token}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.formData) setFormData(parsed.formData)
        if (parsed.completedQuestions) setCompletedQuestions(new Set(parsed.completedQuestions))
        if (parsed.currentSection) setCurrentSection(parsed.currentSection)
      } catch (e) {
        console.error('Failed to restore saved progress:', e)
      }
    }
  }, [token])

  // Auto-save to server periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (Object.keys(formData).length > 0) {
        setSaveStatus('saving')
        try {
          await savePublicQuestionnaireProgress(token, formData)
          setSaveStatus('saved')
        } catch {
          setSaveStatus('error')
        }
      }
    }, 30000) // Save every 30 seconds

    return () => clearInterval(interval)
  }, [formData, token])

  const updateQuestion = useCallback((questionId: string, value: string | string[] | UploadedFile[]) => {
    setFormData(prev => {
      const updated = { ...prev }
      const key = getQuestionKey(questionId)
      const fullKey = `${questionId}_${key}`
      
      // Determine section and update
      if (['q1', 'q2', 'q3', 'q4', 'q5'].includes(questionId)) {
        updated.avatar_definition = { ...updated.avatar_definition, [fullKey]: value }
      } else if (['q6', 'q7', 'q8', 'q9', 'q10'].includes(questionId)) {
        updated.dream_outcome = { ...updated.dream_outcome, [fullKey]: value as string }
      } else if (['q11', 'q12', 'q13', 'q14', 'q15'].includes(questionId)) {
        updated.problems_obstacles = { ...updated.problems_obstacles, [fullKey]: value as string }
      } else if (['q16', 'q17', 'q18', 'q19'].includes(questionId)) {
        updated.solution_methodology = { ...updated.solution_methodology, [fullKey]: value as string }
      } else if (['q20', 'q21', 'q22', 'q23', 'q24'].includes(questionId)) {
        updated.brand_voice = { ...updated.brand_voice, [fullKey]: value }
      } else if (['q25', 'q26', 'q27', 'q28', 'q29'].includes(questionId)) {
        updated.proof_transformation = { ...updated.proof_transformation, [fullKey]: value }
      } else if (['q30', 'q31', 'q32'].includes(questionId)) {
        updated.faith_integration = { ...updated.faith_integration, [fullKey]: value as string }
      } else if (['q33', 'q34'].includes(questionId)) {
        updated.business_metrics = { ...updated.business_metrics, [fullKey]: value as string }
      }
      
      return updated
    })
  }, [])

  const markQuestionCompleted = useCallback((questionId: string) => {
    setCompletedQuestions(prev => new Set(prev).add(questionId))
  }, [])

  const validateQuestion = useCallback(() => undefined, [])

  const goToSection = useCallback((section: number) => {
    if (section >= 1 && section <= 8) {
      setCurrentSection(section)
      setShowReview(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleNext = () => {
    if (currentSection === 8) {
      setShowReview(true)
    } else {
      setCurrentSection(prev => Math.min(prev + 1, 8))
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevious = () => {
    if (showReview) {
      setShowReview(false)
    } else {
      setCurrentSection(prev => Math.max(prev - 1, 1))
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitPublicQuestionnaire(token, formData)
      if (result.success) {
        // Clear localStorage on successful submit
        localStorage.removeItem(`public_questionnaire_${token}`)
        setSubmitted(true)
      } else {
        setError(result.error || 'Failed to submit questionnaire')
      }
    } catch (e) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Submit error:', e)
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate completed sections
  const completedSections: number[] = []
  const sectionQuestionMap: Record<number, string[]> = {
    1: ['q1', 'q2', 'q3', 'q4', 'q5'],
    2: ['q6', 'q7', 'q8', 'q9', 'q10'],
    3: ['q11', 'q12', 'q14', 'q15'],
    4: ['q16', 'q17', 'q18', 'q19'],
    5: ['q20', 'q21', 'q22', 'q23'],
    6: ['q25', 'q26', 'q28'],
    7: ['q30'],
    8: ['q33', 'q34'],
  }

  Object.entries(sectionQuestionMap).forEach(([section, questions]) => {
    const sectionNum = parseInt(section)
    if (sectionNum === 7) {
      const q30 = formData.faith_integration?.q30_faith_preference
      if (q30 === 'separate') {
        completedSections.push(sectionNum)
      } else if (q30 && (q30 === 'explicit' || q30 === 'values_aligned')) {
        if (completedQuestions.has('q31') && completedQuestions.has('q32')) {
          completedSections.push(sectionNum)
        }
      }
      return
    }
    const allComplete = questions.every(q => completedQuestions.has(q))
    if (allComplete) completedSections.push(sectionNum)
  })

  // Create questionnaire form interface for section components
  const questionnaireForm: UseQuestionnaireFormReturn = {
    formData,
    currentSection,
    completedQuestions,
    progress: Math.round((completedQuestions.size / 34) * 100),
    saveStatus: saveStatus as FormStatus,
    updateQuestion,
    validateQuestion,
    validateSection: () => ({ isValid: true }),
    markQuestionCompleted,
    goToSection,
    goToNextStep: () => { handleNext(); return true },
    goToPreviousStep: handlePrevious,
    canGoNext: () => currentSection < 8,
    canGoPrevious: () => currentSection > 1,
    manualSave: () => {},
    isDraft: false,
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 1: return <AvatarDefinitionSection clientId={client.id} questionnaireForm={questionnaireForm} />
      case 2: return <DreamOutcomeSection clientId={client.id} questionnaireForm={questionnaireForm} />
      case 3: return <ProblemsObstaclesSection clientId={client.id} questionnaireForm={questionnaireForm} />
      case 4: return <SolutionMethodologySection clientId={client.id} questionnaireForm={questionnaireForm} />
      case 5: return <BrandVoiceSection clientId={client.id} questionnaireForm={questionnaireForm} />
      case 6: return <ProofTransformationSection clientId={client.id} questionnaireForm={questionnaireForm} />
      case 7: return <FaithIntegrationSection clientId={client.id} questionnaireForm={questionnaireForm} />
      case 8: return <BusinessMetricsSection clientId={client.id} questionnaireForm={questionnaireForm} />
      default: return null
    }
  }
  
  if (submitted) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Thank you for completing the questionnaire!
        </h2>
        <p className="text-silver max-w-md mx-auto">
          Your responses have been saved. We&apos;ll review your information and be in touch soon.
        </p>
      </div>
    )
  }
  
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Client Onboarding for {client.name}
        </h1>
        <p className="text-silver text-sm md:text-base">
          Please complete this questionnaire to help us serve you better.
          Progress is auto-saved as you go.
        </p>
        {saveStatus === 'saving' && (
          <p className="text-xs text-silver mt-2">Saving...</p>
        )}
        {saveStatus === 'saved' && (
          <p className="text-xs text-green-500 mt-2">Progress saved</p>
        )}
      </div>

      {/* Progress Stepper - Mobile optimized */}
      <div className="mb-6 md:mb-8">
        <ProgressStepper
          currentSection={currentSection}
          completedSections={completedSections}
          onSectionClick={goToSection}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {!showReview ? (
        renderCurrentSection()
      ) : (
        <>
          <button
            onClick={() => setShowReview(false)}
            className="mb-4 text-silver hover:text-foreground transition-colors text-sm"
          >
            ← Back to Questionnaire
          </button>
          <QuestionnaireReview 
            clientId={client.id} 
            mode="create"
            isPublic={true}
            publicFormData={formData}
            onPublicSubmit={handleSubmit}
          />
        </>
      )}

      {/* Bottom Navigation - Fixed on mobile */}
      {!showReview && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border p-4 safe-area-bottom z-50">
          <div className="max-w-4xl mx-auto flex gap-3">
            {currentSection > 1 && (
              <button
                onClick={handlePrevious}
                className="flex-1 px-4 py-3 border border-border rounded-lg text-foreground font-medium hover:bg-surface-highlight transition-colors min-h-[48px]"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-red-primary text-white rounded-lg font-medium hover:bg-red-primary/90 transition-colors disabled:opacity-50 min-h-[48px]"
            >
              {currentSection === 8 ? 'Review Answers' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function
function getQuestionKey(questionId: string): string {
  const keyMap: Record<string, string> = {
    q1: 'ideal_customer', q2: 'avatar_criteria', q3: 'demographics', q4: 'psychographics', q5: 'platforms',
    q6: 'dream_outcome', q7: 'status', q8: 'time_to_result', q9: 'effort_sacrifice', q10: 'proof',
    q11: 'external_problems', q12: 'internal_problems', q13: 'philosophical_problems', q14: 'past_failures', q15: 'limiting_beliefs',
    q16: 'core_offer', q17: 'unique_mechanism', q18: 'differentiation', q19: 'delivery_vehicle',
    q20: 'voice_type', q21: 'personality_words', q22: 'signature_phrases', q23: 'avoid_topics', q24: 'brand_assets',
    q25: 'transformation_story', q26: 'measurable_results', q27: 'credentials', q28: 'guarantees', q29: 'proof_assets',
    q30: 'faith_preference', q31: 'faith_mission', q32: 'biblical_principles',
    q33: 'annual_revenue', q34: 'primary_goal',
  }
  return keyMap[questionId] || ''
}
