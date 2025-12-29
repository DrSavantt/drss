'use client';

import { useState } from 'react';
import QuestionWrapper from '../question-types/question-wrapper';
import LongTextQuestion from '../question-types/long-text-question';
import ShortTextQuestion from '../question-types/short-text-question';
import SectionContainer from './section-container';
import { UseQuestionnaireFormReturn } from '@/lib/questionnaire/use-questionnaire-form';
import { HelpPanel, HelpContent } from '../help-system';

interface Props {
  clientId: string;
  questionnaireForm: UseQuestionnaireFormReturn;
}

export default function BusinessMetricsSection({ clientId, questionnaireForm }: Props) {
  const {
    formData,
    updateQuestion,
    markQuestionCompleted,
    completedQuestions,
  } = questionnaireForm;

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(33);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Calculate section progress
  const sectionQuestions = ['q33', 'q34'];
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
          questionNumber={33}
          questionText="What is your current annual revenue?"
          isRequired={true}
          onHelpClick={() => openHelp(33)}
          estimatedTime="1 min"
        >
          <ShortTextQuestion
            value={formData.business_metrics.q33_annual_revenue}
            onChange={(val) => updateQuestion('q33', val)}
            onBlur={() => markQuestionCompleted('q33')}
            placeholder="$500K ARR"
            maxLength={100}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={34}
          questionText="What is your primary business goal for the next 12 months?"
          isRequired={true}
          onHelpClick={() => openHelp(34)}
          estimatedTime="3 min"
        >
          <LongTextQuestion
            value={formData.business_metrics.q34_primary_goal}
            onChange={(val) => updateQuestion('q34', val)}
            onBlur={() => markQuestionCompleted('q34')}
            placeholder="Scale from $500K to $1.5M while working 30 hours/week instead of 60..."
            minLength={1}
            maxLength={1000}
          />
        </QuestionWrapper>
      </SectionContainer>
    </>
  );
}
