'use client';

import { useState } from 'react';
import QuestionWrapper from '../question-types/question-wrapper';
import LongTextQuestion from '../question-types/long-text-question';
import { FileUploadQuestion } from '../question-types/file-upload-question';
import SectionContainer from './section-container';
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form';
import { HelpPanel, HelpContent } from '../help-system';

interface Props {
  clientId: string;
}

export default function ProofTransformationSection({ clientId }: Props) {
  const {
    formData,
    updateQuestion,
    
    markQuestionCompleted,
    completedQuestions,
  } = useQuestionnaireForm(clientId);

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(24);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Calculate section progress
  const sectionQuestions = ['q24', 'q25', 'q26', 'q27'];
  const answeredCount = sectionQuestions.filter(q => 
    completedQuestions.has(q)
  ).length;

  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        <HelpContent questionNumber={currentHelpQuestion} />
      </HelpPanel>

      <SectionContainer
        sectionNumber={6}
        title="Proof & Transformation"
        description="Demonstrate your track record and results"
        estimatedTime="7 minutes"
        currentProgress={{ answered: answeredCount, total: 4 }}
      >
        <QuestionWrapper
          questionNumber={24}
          questionText="Share a powerful transformation story"
          isRequired={true}
          onHelpClick={() => openHelp(24)}
          estimatedTime="3 min"
        >
          <LongTextQuestion
            value={formData.proof_transformation.q24_transformation_story}
            onChange={(val) => updateQuestion('q24', val)}
            onBlur={() => markQuestionCompleted('q24')}
            placeholder="Sarah came to us $50K in debt and working 80 hours/week. After 90 days..."
            minLength={100}
            maxLength={2000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={25}
          questionText="What measurable results do you deliver?"
          isRequired={true}
          onHelpClick={() => openHelp(25)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.proof_transformation.q25_measurable_results}
            onChange={(val) => updateQuestion('q25', val)}
            onBlur={() => markQuestionCompleted('q25')}
            placeholder="Average client ROI: 3.2x in 90 days. 89% achieve positive ROI within 60 days..."
            minLength={50}
            maxLength={1000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={26}
          questionText="What credentials or recognition do you have? (Optional)"
          onHelpClick={() => openHelp(26)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.proof_transformation.q26_credentials}
            onChange={(val) => updateQuestion('q26', val)}
            onBlur={() => markQuestionCompleted('q26')}
            placeholder="Featured in Forbes, Inc, Entrepreneur. Certified by..."
            maxLength={500}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={27}
          questionText="What guarantees do you offer?"
          isRequired={true}
          onHelpClick={() => openHelp(27)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.proof_transformation.q27_guarantees}
            onChange={(val) => updateQuestion('q27', val)}
            onBlur={() => markQuestionCompleted('q27')}
            placeholder="100% money-back guarantee if you don't see 20+ qualified leads in 90 days..."
            minLength={30}
            maxLength={500}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={34}
          questionText="Upload proof materials (optional)"
          isRequired={false}
          onHelpClick={() => openHelp(34)}
          estimatedTime="2 min"
        >
          <FileUploadQuestion
            value={formData.proof_transformation.q34_proof_assets || []}
            onChange={(files) => {
              updateQuestion('q34', files);
              if (files.length > 0) markQuestionCompleted('q34');
            }}
            label="Proof Materials"
            description="Upload testimonials, case studies, screenshots, or any proof materials (optional)"
            maxFiles={5}
            maxSizeInMB={10}
            acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
          />
        </QuestionWrapper>
      </SectionContainer>
    </>
  );
}
