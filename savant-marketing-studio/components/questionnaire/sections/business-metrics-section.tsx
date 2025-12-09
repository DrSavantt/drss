'use client';

import { useState } from 'react';
import QuestionWrapper from '../question-types/question-wrapper';
import LongTextQuestion from '../question-types/long-text-question';
import ShortTextQuestion from '../question-types/short-text-question';
import SectionContainer from './section-container';
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form';
import { HelpPanel, HelpContent } from '../help-system';

interface Props {
  clientId: string;
}

export default function BusinessMetricsSection({ clientId }: Props) {
  const {
    formData,
    updateQuestion,
    validateQuestion,
    markQuestionCompleted,
    completedQuestions,
  } = useQuestionnaireForm(clientId);

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(31);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Calculate section progress
  const sectionQuestions = ['q31', 'q32'];
  const answeredCount = sectionQuestions.filter(q => 
    completedQuestions.has(q)
  ).length;

  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        <HelpContent questionNumber={currentHelpQuestion} />
      </HelpPanel>

      <SectionContainer
        sectionNumber={8}
        title="Business Metrics"
        description="Quick snapshot of your business size and goals"
        estimatedTime="4 minutes"
        currentProgress={{ answered: answeredCount, total: 2 }}
      >
        <QuestionWrapper
          questionNumber={31}
          questionText="What is your current annual revenue?"
          isRequired={true}
          onHelpClick={() => openHelp(31)}
          estimatedTime="1 min"
        >
          <ShortTextQuestion
            value={formData.business_metrics.q31_annual_revenue}
            onChange={(val) => {
              updateQuestion('q31', val);
              if (val.length >= 1) markQuestionCompleted('q31');
            }}
            placeholder="$500K ARR"
            maxLength={100}
            error={validateQuestion('q31')}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={32}
          questionText="What is your primary business goal for the next 12 months?"
          isRequired={true}
          onHelpClick={() => openHelp(32)}
          estimatedTime="3 min"
        >
          <LongTextQuestion
            value={formData.business_metrics.q32_primary_goal}
            onChange={(val) => {
              updateQuestion('q32', val);
              if (val.length >= 1) markQuestionCompleted('q32');
            }}
            placeholder="Scale from $500K to $1.5M while working 30 hours/week instead of 60..."
            minLength={1}
            maxLength={1000}
            error={validateQuestion('q32')}
          />
        </QuestionWrapper>
      </SectionContainer>
    </>
  );
}
