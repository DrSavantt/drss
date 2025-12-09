'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProgressIndicator, SectionNav } from '@/components/questionnaire/navigation';
import { sections } from '@/lib/questionnaire/section-data';
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
  const clientId = params.id as string;
  
  const { currentSection, completedQuestions, goToSection } = useQuestionnaireForm(clientId);
  const [showReview, setShowReview] = useState(false);

  // Calculate completed sections
  const completedSections: number[] = [];
  const sectionQuestionMap: Record<number, string[]> = {
    1: ['q1', 'q2', 'q3', 'q4', 'q5'],
    2: ['q6', 'q7', 'q8', 'q9', 'q10'],
    3: ['q11', 'q12', 'q14', 'q15'], // Q13 is optional
    4: ['q16', 'q17', 'q18', 'q19'],
    5: ['q20', 'q21', 'q22', 'q23'],
    6: ['q24', 'q25', 'q27'], // Q26 is optional
    7: [], // All optional
    8: ['q31', 'q32'],
  };

  Object.entries(sectionQuestionMap).forEach(([section, questions]) => {
    if (questions.length === 0) {
      // Section 7 is all optional
      completedSections.push(parseInt(section));
    } else {
      const allComplete = questions.every(q => completedQuestions.has(q));
      if (allComplete) completedSections.push(parseInt(section));
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Progress Indicator */}
      <ProgressIndicator
        currentSection={currentSection}
        completedSections={completedSections}
      />

      <div className="flex">
        {/* Left Sidebar Navigation */}
        <aside className="sticky top-20 h-[calc(100vh-80px)]">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <SectionNav
                sections={sections}
                currentSection={currentSection}
                completedSections={completedSections}
                onSectionClick={goToSection}
              />
            </div>
            
            {/* Review Button */}
            <div className="p-4 border-t border-border bg-surface">
              <button
                onClick={() => setShowReview(true)}
                className="w-full bg-red-primary text-white py-3 rounded-lg font-bold hover:bg-red-primary/90 transition-colors"
              >
                Review & Submit
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 max-w-4xl mx-auto">
          {!showReview ? (
            <>
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  Client Onboarding Questionnaire
                </h1>
                <p className="text-silver text-lg">
                  Complete all sections to help us understand your business and create targeted content.
                  Your progress is auto-saved every 30 seconds.
                </p>
              </div>

              {/* All 8 Sections */}
              <AvatarDefinitionSection clientId={clientId} />
              <DreamOutcomeSection clientId={clientId} />
              <ProblemsObstaclesSection clientId={clientId} />
              <SolutionMethodologySection clientId={clientId} />
              <BrandVoiceSection clientId={clientId} />
              <ProofTransformationSection clientId={clientId} />
              <FaithIntegrationSection clientId={clientId} />
              <BusinessMetricsSection clientId={clientId} />

              {/* Bottom Review Button */}
              <div className="mt-12 p-6 bg-surface rounded-lg border border-border">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Ready to submit?
                </h2>
                <p className="text-silver mb-4">
                  Review your answers before submitting the questionnaire.
                </p>
                <button
                  onClick={() => {
                    setShowReview(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-red-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-red-primary/90 transition-colors"
                >
                  Review & Submit
                </button>
              </div>
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
      </div>
    </div>
  );
}
