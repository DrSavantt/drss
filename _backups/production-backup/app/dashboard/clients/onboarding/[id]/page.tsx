'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ProgressStepper } from '@/components/questionnaire/navigation/progress-stepper';
import { RichFooter } from '@/components/questionnaire/navigation/rich-footer';
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form';
import { QuestionnaireReview } from '@/components/questionnaire/review';
import { getClient } from '@/app/actions/clients';
import { QuestionnaireData } from '@/lib/questionnaire/types';
import { Info } from 'lucide-react';
import { CopyableCode } from '@/components/copyable-code';

// Import all 8 section components
import AvatarDefinitionSection from '@/components/questionnaire/sections/avatar-definition-section';
import DreamOutcomeSection from '@/components/questionnaire/sections/dream-outcome-section';
import ProblemsObstaclesSection from '@/components/questionnaire/sections/problems-obstacles-section';
import SolutionMethodologySection from '@/components/questionnaire/sections/solution-methodology-section';
import BrandVoiceSection from '@/components/questionnaire/sections/brand-voice-section';
import ProofTransformationSection from '@/components/questionnaire/sections/proof-transformation-section';
import FaithIntegrationSection from '@/components/questionnaire/sections/faith-integration-section';
import BusinessMetricsSection from '@/components/questionnaire/sections/business-metrics-section';

export default function QuestionnairePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = params.id as string;
  const mode = searchParams.get('mode') || 'create';
  const isEditMode = mode === 'edit';
  
  // State for existing data when in edit mode
  const [existingData, setExistingData] = useState<QuestionnaireData | null>(null);
  const [clientCode, setClientCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditMode);

  // Fetch client data (always for client_code, and responses when in edit mode)
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const client = await getClient(clientId);
        if (client) {
          setClientCode(client.client_code || null);
          if (isEditMode && client.intake_responses?.sections) {
            setExistingData(client.intake_responses.sections as QuestionnaireData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch client data:', error);
      } finally {
        if (isEditMode) {
          setLoading(false);
        }
      }
    };
    fetchClientData();
  }, [isEditMode, clientId]);
  
  const questionnaireForm = useQuestionnaireForm(clientId, existingData, isEditMode);
  
  const {
    formData,
    currentSection,
    completedQuestions,
    goToSection,
    goToNextStep,
    goToPreviousStep,
    canGoNext,
    canGoPrevious,
    validateSection,
    manualSave,
    saveStatus,
  } = questionnaireForm;

  const [showReview, setShowReview] = useState(false);

  // Read step from URL on mount
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'review') {
      setShowReview(true);
    } else if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (step >= 1 && step <= 8) {
        goToSection(step);
      }
    }
  }, [searchParams, goToSection]);

  // Update URL when step changes (preserve mode parameter)
  useEffect(() => {
    const modeParam = isEditMode ? '&mode=edit' : '';
    const url = showReview 
      ? `/dashboard/clients/onboarding/${clientId}?step=review${modeParam}`
      : `/dashboard/clients/onboarding/${clientId}?step=${currentSection}${modeParam}`;
    window.history.replaceState({}, '', url);
  }, [currentSection, showReview, clientId, isEditMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showReview) return;

      // Cmd/Ctrl + Arrow Right = Next
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }

      // Cmd/Ctrl + Arrow Left = Previous
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }

      // Escape = Save and exit
      if (e.key === 'Escape') {
        e.preventDefault();
        manualSave();
        router.push(`/dashboard/clients/${clientId}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showReview, currentSection, manualSave, router, clientId]);

  // Calculate completed sections
  const completedSections: number[] = [];
  const sectionQuestionMap: Record<number, string[]> = {
    1: ['q1', 'q2', 'q3', 'q4', 'q5'],
    2: ['q6', 'q7', 'q8', 'q9', 'q10'],
    3: ['q11', 'q12', 'q14', 'q15'],
    4: ['q16', 'q17', 'q18', 'q19'],
    5: ['q20', 'q21', 'q22', 'q23'],
    6: ['q25', 'q26', 'q28'],
    7: ['q30'], // Faith section - special logic below
    8: ['q33', 'q34'],
  };

  Object.entries(sectionQuestionMap).forEach(([section, questions]) => {
    const sectionNum = parseInt(section);
    
    // Special logic for Section 7 (Faith Integration)
    if (sectionNum === 7) {
      const q30 = formData.faith_integration?.q30_faith_preference;
      
      // Section 7 is complete if:
      // - Q30 is answered with "separate" (Q31/Q32 hidden), OR
      // - Q30 is answered with "explicit" or "values_aligned" AND Q31 and Q32 are both completed
      if (q30 === 'separate') {
        completedSections.push(sectionNum);
      } else if (q30 && (q30 === 'explicit' || q30 === 'values_aligned')) {
        if (completedQuestions.has('q31') && completedQuestions.has('q32')) {
          completedSections.push(sectionNum);
        }
      }
      // If Q30 is empty or any other value, section is not complete
      return;
    }
    
    // Standard logic for all other sections
      const allComplete = questions.every(q => completedQuestions.has(q));
    if (allComplete) completedSections.push(sectionNum);
  });

  const handleNext = () => {
    if (currentSection === 8) {
      // Last section - go to review
      setShowReview(true);
    } else {
      // Just go to next section, no validation
      goToNextStep();
    }
  };

  const handlePrevious = () => {
    if (showReview) {
      setShowReview(false);
    } else {
      // Just go back, no checks needed
      goToPreviousStep();
    }
  };

  const handleStepClick = (step: number) => {
    goToSection(step);
    setShowReview(false);
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 1:
        return <AvatarDefinitionSection clientId={clientId} questionnaireForm={questionnaireForm} />;
      case 2:
        return <DreamOutcomeSection clientId={clientId} questionnaireForm={questionnaireForm} />;
      case 3:
        return <ProblemsObstaclesSection clientId={clientId} questionnaireForm={questionnaireForm} />;
      case 4:
        return <SolutionMethodologySection clientId={clientId} questionnaireForm={questionnaireForm} />;
      case 5:
        return <BrandVoiceSection clientId={clientId} questionnaireForm={questionnaireForm} />;
      case 6:
        return <ProofTransformationSection clientId={clientId} questionnaireForm={questionnaireForm} />;
      case 7:
        return <FaithIntegrationSection clientId={clientId} questionnaireForm={questionnaireForm} />;
      case 8:
        return <BusinessMetricsSection clientId={clientId} questionnaireForm={questionnaireForm} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Progress Stepper */}
      <ProgressStepper
        currentSection={currentSection}
        completedSections={completedSections}
        onSectionClick={handleStepClick}
      />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-primary"></div>
            <span className="ml-3 text-silver">Loading responses...</span>
          </div>
        ) : !showReview ? (
          <>
            {/* Edit Mode Banner */}
            {isEditMode && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm flex items-center">
                  <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                  You are editing existing responses. Changes will be saved when you submit.
                </p>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                {clientCode && (
                  <CopyableCode 
                    code={clientCode} 
                    className="bg-dark-gray px-2.5 py-1 rounded text-sm"
                  />
                )}
                <h1 className="text-3xl font-bold text-foreground">
                  {isEditMode ? 'Edit Responses' : 'Onboarding'}
              </h1>
              </div>
              <p className="text-silver">
                {isEditMode 
                  ? 'Update any answers below. Your changes will be saved when you submit.'
                  : 'Complete all sections to help us understand your business. Your progress is auto-saved as you type.'}
              </p>
            </div>

            {/* Current Section Only */}
            {renderCurrentSection()}
          </>
        ) : (
          <>
            <button
              onClick={() => setShowReview(false)}
              className="mb-4 text-silver hover:text-foreground transition-colors"
            >
              ← Back to Questionnaire
            </button>
            <QuestionnaireReview clientId={clientId} mode={mode as 'create' | 'edit'} />
          </>
        )}
      </main>

      {/* Bottom Navigation Footer */}
      {!showReview && (
        <RichFooter
          clientId={clientId}
          currentSection={currentSection}
          onPrevious={handlePrevious}
          onNext={handleNext}
          saveStatus={saveStatus === 'saved' ? 'saved' : saveStatus === 'saving' ? 'saving' : 'idle'}
          isLastSection={currentSection === 8}
        />
      )}

    </div>
  );
}
