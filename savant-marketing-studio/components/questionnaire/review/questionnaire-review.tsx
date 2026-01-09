'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form';
import { QuestionnaireData, getRequiredQuestionKeys } from '@/lib/questionnaire/types';
import { useQuestionnaireConfigOptional } from '@/lib/questionnaire/questionnaire-config-context';
import { saveQuestionnaire } from '@/app/actions/questionnaire';
import ReviewSectionCard from './review-section-card';

interface Props {
  clientId: string;
  mode?: 'create' | 'edit';
  isPublic?: boolean;
  publicFormData?: QuestionnaireData;
  onPublicSubmit?: () => Promise<void>;
}

export default function QuestionnaireReview({ 
  clientId, 
  mode = 'create',
  isPublic = false,
  publicFormData,
  onPublicSubmit
}: Props) {
  const router = useRouter();
  const isEditMode = mode === 'edit';
  
  // Get config from context for dynamic rendering
  const configContext = useQuestionnaireConfigOptional();
  
  // Use hook for internal forms, or use provided data for public forms
  const internalForm = useQuestionnaireForm(clientId);
  const formData = isPublic && publicFormData ? publicFormData : internalForm.formData;
  const completedQuestions = isPublic ? new Set<string>() : internalForm.completedQuestions;
  const progress = isPublic ? 100 : internalForm.progress; // Public forms don't block on progress
  
  // Get required question keys dynamically from config
  const requiredQuestionKeys = useMemo(() => {
    if (configContext?.questions) {
      return getRequiredQuestionKeys(configContext.questions);
    }
    // Fallback: no required questions if config not available
    return [];
  }, [configContext?.questions]);
  
  // Get total required questions count for remaining calculation
  const totalRequiredCount = requiredQuestionKeys.length;
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    // For public forms, use the provided callback
    if (isPublic && onPublicSubmit) {
      setSubmitting(true);
      setError(null);
      try {
        await onPublicSubmit();
        setSuccessMessage('Questionnaire submitted successfully!');
      } catch {
        setError('An unexpected error occurred');
        setSubmitting(false);
      }
      return;
    }

    // Validate all required questions (only for internal forms)
    if (!isPublic && progress < 100) {
      setError('Please complete all required questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await saveQuestionnaire(clientId, formData, mode);

      if (result.success) {
        // Clear localStorage (sync is fine here since we're redirecting)
        localStorage.removeItem(`questionnaire_draft_${clientId}`);
        localStorage.removeItem(`questionnaire_completed_${clientId}`);

        // Show success message briefly
        setSuccessMessage(isEditMode ? 'Responses updated successfully!' : 'Questionnaire submitted successfully!');
        
        // Redirect based on mode
        setTimeout(() => {
          if (isEditMode) {
            // Redirect back to responses page when editing
            router.push(`/dashboard/clients/${clientId}/questionnaire-responses`);
          } else {
            // Redirect to client page when creating
        router.push(`/dashboard/clients/${clientId}`);
          }
        }, 1000);
      } else {
        // Handle validation errors
        if (result.validationErrors && Object.keys(result.validationErrors).length > 0) {
          const errorCount = Object.keys(result.validationErrors).length;
          const errorList = Object.entries(result.validationErrors)
            .slice(0, 3) // Show first 3 errors
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
          
          setError(
            `${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'} found:\n\n${errorList}${
              errorCount > 3 ? `\n\n...and ${errorCount - 3} more` : ''
            }`
          );
      } else {
        setError(result.error || 'Failed to save questionnaire');
        }
        setSubmitting(false);
      }
    } catch {
      setError('An unexpected error occurred');
      setSubmitting(false);
    }
  };

  const handleEditSection = (sectionNumber: number) => {
    const element = document.getElementById(`section-${sectionNumber}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Calculate remaining required questions dynamically
  const completedRequiredCount = Array.from(completedQuestions)
    .filter(q => requiredQuestionKeys.includes(q)).length;
  const remainingRequired = totalRequiredCount - completedRequiredCount;

  // Render sections dynamically from config if available
  const renderSections = () => {
    // If config is available, render dynamically
    if (configContext?.sections && configContext?.questions) {
      const enabledSections = configContext.getEnabledSections();
      
      return enabledSections.map(section => {
        // Get questions for this section
        const sectionQuestions = configContext.getQuestionsForSection(section.id);
        const questionKeys = sectionQuestions.map(q => q.key);
        
        // Get section data from formData
        const sectionData = formData[section.key] || {};
        
        return (
          <ReviewSectionCard
            key={section.id}
            sectionNumber={section.id}
            title={section.title}
            questions={sectionData as Record<string, string | string[] | undefined>}
            questionKeys={questionKeys}
            requiredQuestions={requiredQuestionKeys}
            completedQuestions={completedQuestions}
            onEdit={() => handleEditSection(section.id)}
          />
        );
      });
    }
    
    // Fallback: render hardcoded sections if config not available
    // This maintains backward compatibility but should be removed once all usages are updated
    return (
      <>
        <ReviewSectionCard
          sectionNumber={1}
          title="Avatar Definition"
          questions={(formData.avatar_definition || {}) as Record<string, string | string[] | undefined>}
          questionKeys={['q1', 'q2', 'q3', 'q4', 'q5']}
          requiredQuestions={requiredQuestionKeys}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(1)}
        />

        <ReviewSectionCard
          sectionNumber={2}
          title="Dream Outcome & Value Equation"
          questions={(formData.dream_outcome || {}) as Record<string, string | string[] | undefined>}
          questionKeys={['q6', 'q7', 'q8', 'q9', 'q10']}
          requiredQuestions={requiredQuestionKeys}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(2)}
        />

        <ReviewSectionCard
          sectionNumber={3}
          title="Problems & Obstacles"
          questions={(formData.problems_obstacles || {}) as Record<string, string | string[] | undefined>}
          questionKeys={['q11', 'q12', 'q13', 'q14', 'q15']}
          requiredQuestions={requiredQuestionKeys}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(3)}
        />

        <ReviewSectionCard
          sectionNumber={4}
          title="Solution & Methodology"
          questions={(formData.solution_methodology || {}) as Record<string, string | string[] | undefined>}
          questionKeys={['q16', 'q17', 'q18', 'q19']}
          requiredQuestions={requiredQuestionKeys}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(4)}
        />

        <ReviewSectionCard
          sectionNumber={5}
          title="Brand Voice & Communication"
          questions={(formData.brand_voice || {}) as Record<string, string | string[] | undefined>}
          questionKeys={['q20', 'q21', 'q22', 'q23']}
          requiredQuestions={requiredQuestionKeys}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(5)}
        />

        <ReviewSectionCard
          sectionNumber={6}
          title="Proof & Transformation"
          questions={(formData.proof_transformation || {}) as Record<string, string | string[] | undefined>}
          questionKeys={['q24', 'q25', 'q26', 'q27']}
          requiredQuestions={requiredQuestionKeys}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(6)}
        />

        <ReviewSectionCard
          sectionNumber={7}
          title="Faith Integration"
          questions={(formData.faith_integration || {}) as Record<string, string | string[] | undefined>}
          questionKeys={['q28', 'q29', 'q30']}
          requiredQuestions={requiredQuestionKeys}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(7)}
        />

        <ReviewSectionCard
          sectionNumber={8}
          title="Business Metrics"
          questions={(formData.business_metrics || {}) as Record<string, string | string[] | undefined>}
          questionKeys={['q31', 'q32']}
          requiredQuestions={requiredQuestionKeys}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(8)}
        />
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isEditMode ? 'Review Your Changes' : 'Review Your Answers'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode 
            ? 'Review your updated responses before saving. You can edit any section if needed.'
            : 'Review all your responses before submitting. You can edit any section if needed.'}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8 p-6 bg-card rounded-lg border border-border">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-foreground">Overall Progress</span>
          <span className="text-2xl font-bold text-foreground">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {progress === 100
            ? '✓ All required questions completed'
            : `${remainingRequired} required questions remaining`}
        </p>
      </div>

      {/* All sections - rendered dynamically */}
      <div className="space-y-4 mb-8">
        {renderSections()}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive font-medium whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="mb-8 p-4 bg-green-500/10 border border-green-500 rounded-lg">
          <p className="text-green-500 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || (!isPublic && progress < 100) || !!successMessage}
        className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[56px] flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
        {submitting 
          ? (isEditMode ? 'Saving Changes...' : 'Submitting...') 
          : (isEditMode ? 'Save Changes' : 'Submit Questionnaire')}
      </button>

      {!isPublic && progress < 100 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Please complete all required questions before {isEditMode ? 'saving' : 'submitting'}
        </p>
      )}
    </div>
  );
}
