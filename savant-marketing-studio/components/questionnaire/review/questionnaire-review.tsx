'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form';
import { REQUIRED_QUESTIONS, QuestionnaireData } from '@/lib/questionnaire/types';
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
  
  // Use hook for internal forms, or use provided data for public forms
  const internalForm = useQuestionnaireForm(clientId);
  const formData = isPublic && publicFormData ? publicFormData : internalForm.formData;
  const completedQuestions = isPublic ? new Set<string>() : internalForm.completedQuestions;
  const progress = isPublic ? 100 : internalForm.progress; // Public forms don't block on progress
  
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

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isEditMode ? 'Review Your Changes' : 'Review Your Answers'}
        </h1>
        <p className="text-silver">
          {isEditMode 
            ? 'Review your updated responses before saving. You can edit any section if needed.'
            : 'Review all your responses before submitting. You can edit any section if needed.'}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8 p-6 bg-surface rounded-lg border border-border">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-foreground">Overall Progress</span>
          <span className="text-2xl font-bold text-foreground">{progress}%</span>
        </div>
        <div className="w-full bg-surface-highlight rounded-full h-3">
          <div
            className="bg-red-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-silver mt-2">
          {progress === 100
            ? '✓ All required questions completed'
            : `${27 - Array.from(completedQuestions).filter(q => REQUIRED_QUESTIONS.includes(q)).length} required questions remaining`}
        </p>
      </div>

      {/* All sections */}
      <div className="space-y-4 mb-8">
        <ReviewSectionCard
          sectionNumber={1}
          title="Avatar Definition"
          questions={formData.avatar_definition}
          questionKeys={['q1', 'q2', 'q3', 'q4', 'q5']}
          requiredQuestions={REQUIRED_QUESTIONS}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(1)}
        />

        <ReviewSectionCard
          sectionNumber={2}
          title="Dream Outcome & Value Equation"
          questions={formData.dream_outcome}
          questionKeys={['q6', 'q7', 'q8', 'q9', 'q10']}
          requiredQuestions={REQUIRED_QUESTIONS}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(2)}
        />

        <ReviewSectionCard
          sectionNumber={3}
          title="Problems & Obstacles"
          questions={formData.problems_obstacles}
          questionKeys={['q11', 'q12', 'q13', 'q14', 'q15']}
          requiredQuestions={REQUIRED_QUESTIONS}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(3)}
        />

        <ReviewSectionCard
          sectionNumber={4}
          title="Solution & Methodology"
          questions={formData.solution_methodology}
          questionKeys={['q16', 'q17', 'q18', 'q19']}
          requiredQuestions={REQUIRED_QUESTIONS}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(4)}
        />

        <ReviewSectionCard
          sectionNumber={5}
          title="Brand Voice & Communication"
          questions={formData.brand_voice}
          questionKeys={['q20', 'q21', 'q22', 'q23']}
          requiredQuestions={REQUIRED_QUESTIONS}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(5)}
        />

        <ReviewSectionCard
          sectionNumber={6}
          title="Proof & Transformation"
          questions={formData.proof_transformation}
          questionKeys={['q24', 'q25', 'q26', 'q27']}
          requiredQuestions={REQUIRED_QUESTIONS}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(6)}
        />

        <ReviewSectionCard
          sectionNumber={7}
          title="Faith Integration"
          questions={formData.faith_integration}
          questionKeys={['q28', 'q29', 'q30']}
          requiredQuestions={REQUIRED_QUESTIONS}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(7)}
        />

        <ReviewSectionCard
          sectionNumber={8}
          title="Business Metrics"
          questions={formData.business_metrics}
          questionKeys={['q31', 'q32']}
          requiredQuestions={REQUIRED_QUESTIONS}
          completedQuestions={completedQuestions}
          onEdit={() => handleEditSection(8)}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-500 font-medium whitespace-pre-line">{error}</p>
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
        className="w-full bg-red-primary text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-red-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[56px] flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
        {submitting 
          ? (isEditMode ? 'Saving Changes...' : 'Submitting...') 
          : (isEditMode ? 'Save Changes' : 'Submit Questionnaire')}
      </button>

      {!isPublic && progress < 100 && (
        <p className="text-center text-sm text-silver mt-4">
          Please complete all required questions before {isEditMode ? 'saving' : 'submitting'}
        </p>
      )}
    </div>
  );
}
