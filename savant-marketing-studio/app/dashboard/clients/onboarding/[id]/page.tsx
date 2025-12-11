'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ProgressStepper } from '@/components/questionnaire/navigation/progress-stepper';
import { RichFooter } from '@/components/questionnaire/navigation/rich-footer';
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form';
import { QuestionnaireReview } from '@/components/questionnaire/review';

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
  
  const questionnaireForm = useQuestionnaireForm(clientId);
  
  const {
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
  const [footerSaveStatus, setFooterSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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

  // Update URL when step changes
  useEffect(() => {
    const url = showReview 
      ? `/dashboard/clients/onboarding/${clientId}?step=review`
      : `/dashboard/clients/onboarding/${clientId}?step=${currentSection}`;
    window.history.replaceState({}, '', url);
  }, [currentSection, showReview, clientId]);

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
    6: ['q24', 'q25', 'q27'],
    7: [],
    8: ['q31', 'q32'],
  };

  Object.entries(sectionQuestionMap).forEach(([section, questions]) => {
    if (questions.length === 0) {
      completedSections.push(parseInt(section));
    } else {
      const allComplete = questions.every(q => completedQuestions.has(q));
      if (allComplete) completedSections.push(parseInt(section));
    }
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
        {!showReview ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Client Onboarding Questionnaire
              </h1>
              <p className="text-silver">
                Complete all sections to help us understand your business. Your progress is auto-saved as you type.
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
            <QuestionnaireReview clientId={clientId} />
          </>
        )}
      </main>

      {/* Bottom Navigation Footer */}
      {!showReview && (
        <RichFooter
          currentSection={currentSection}
          onPrevious={handlePrevious}
          onNext={handleNext}
          saveStatus={saveStatus === 'saved' ? 'saved' : saveStatus === 'saving' ? 'saving' : 'idle'}
          isLastSection={currentSection === 8}
        />
      )}

      {/* Dev-only Reset Button */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => {
            if (confirm('Clear ALL questionnaire data and start fresh?')) {
              localStorage.removeItem(`questionnaire_draft_${clientId}`);
              localStorage.removeItem(`questionnaire_completed_${clientId}`);
              localStorage.removeItem(`questionnaire_section_${clientId}`);
              window.location.reload();
            }
          }}
          className="fixed bottom-4 left-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          🗑️ Reset
        </button>
      )}
    </div>
  );
}
