'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ProgressIndicator } from '@/components/questionnaire/navigation';
import StepFooter from '@/components/questionnaire/navigation/step-footer';
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
  } = useQuestionnaireForm(clientId);

  const [showReview, setShowReview] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();

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
      // Go to review
      setShowReview(true);
      setValidationError(undefined);
    } else {
      const validation = validateSection(currentSection);
      if (validation.isValid) {
        goToNextStep();
        setValidationError(undefined);
      } else {
        setValidationError(validation.error);
      }
    }
  };

  const handlePrevious = () => {
    if (showReview) {
      setShowReview(false);
    } else {
      goToPreviousStep();
      setValidationError(undefined);
    }
  };

  const handleStepClick = (step: number) => {
    goToSection(step);
    setShowReview(false);
    setValidationError(undefined);
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 1:
        return <AvatarDefinitionSection clientId={clientId} />;
      case 2:
        return <DreamOutcomeSection clientId={clientId} />;
      case 3:
        return <ProblemsObstaclesSection clientId={clientId} />;
      case 4:
        return <SolutionMethodologySection clientId={clientId} />;
      case 5:
        return <BrandVoiceSection clientId={clientId} />;
      case 6:
        return <ProofTransformationSection clientId={clientId} />;
      case 7:
        return <FaithIntegrationSection clientId={clientId} />;
      case 8:
        return <BusinessMetricsSection clientId={clientId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Progress Indicator */}
      <ProgressIndicator
        currentSection={currentSection}
        completedSections={completedSections}
        onStepClick={handleStepClick}
      />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
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
        <StepFooter
          currentStep={currentSection}
          totalSteps={8}
          canGoNext={canGoNext()}
          canGoPrevious={canGoPrevious()}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSave={manualSave}
          saveStatus={saveStatus}
          validationError={validationError}
        />
      )}
    </div>
  );
}
