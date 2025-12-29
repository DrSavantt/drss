'use client';

import { useState } from 'react';
import QuestionWrapper from '../question-types/question-wrapper';
import LongTextQuestion from '../question-types/long-text-question';
import MultipleChoiceQuestion from '../question-types/multiple-choice-question';
import SectionContainer from './section-container';
import { UseQuestionnaireFormReturn } from '@/lib/questionnaire/use-questionnaire-form';
import { HelpPanel, HelpContent } from '../help-system';
import { shouldShowQuestion } from '@/lib/questionnaire/conditional-logic';

interface Props {
  clientId: string;
  questionnaireForm: UseQuestionnaireFormReturn;
}

export default function FaithIntegrationSection({ clientId, questionnaireForm }: Props) {
  const {
    formData,
    updateQuestion,
    markQuestionCompleted,
    completedQuestions,
  } = questionnaireForm;

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(30);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Check if Q31 and Q32 should be shown (conditional logic)
  const showQ31 = shouldShowQuestion('q31', formData);
  const showQ32 = shouldShowQuestion('q32', formData);

  // Calculate section progress (only count visible questions)
  const sectionQuestions = ['q30'];
  if (showQ31) sectionQuestions.push('q31');
  if (showQ32) sectionQuestions.push('q32');
  
  const answeredCount = sectionQuestions.filter(q => 
    completedQuestions.has(q)
  ).length;

  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        <HelpContent questionNumber={currentHelpQuestion} />
      </HelpPanel>

      <SectionContainer
        sectionNumber={7}
        title="Faith Integration"
        description="Optional: Define how faith integrates with your business (if applicable)"
        estimatedTime="3 minutes"
        currentProgress={{ answered: answeredCount, total: sectionQuestions.length }}
      >
        <QuestionWrapper
          questionNumber={30}
          questionText="How does faith integrate with your business?"
          onHelpClick={() => openHelp(30)}
          estimatedTime="1 min"
        >
          <MultipleChoiceQuestion
            value={formData.faith_integration.q30_faith_preference}
            onChange={(val) => {
              updateQuestion('q30', val);
              if (val) markQuestionCompleted('q30');
            }}
            options={[
              { value: 'explicit', label: 'Yes - Explicitly faith-forward in marketing' },
              { value: 'values_aligned', label: 'Yes - Values-aligned but subtle' },
              { value: 'separate', label: 'No - Keep faith and business separate' }
            ]}
            allowMultiple={false}
          />
        </QuestionWrapper>

        {showQ31 && (
          <QuestionWrapper
            questionNumber={31}
            questionText="What is your faith-driven mission?"
            onHelpClick={() => openHelp(31)}
            estimatedTime="1 min"
          >
            <LongTextQuestion
              value={formData.faith_integration.q31_faith_mission}
              onChange={(val) => updateQuestion('q31', val)}
              onBlur={() => markQuestionCompleted('q31')}
              placeholder="I believe business is ministry. My goal is to serve kingdom-minded entrepreneurs..."
              maxLength={1000}
            />
          </QuestionWrapper>
        )}

        {showQ32 && (
          <QuestionWrapper
            questionNumber={32}
            questionText="What biblical principles guide your work?"
            onHelpClick={() => openHelp(32)}
            estimatedTime="1 min"
          >
            <LongTextQuestion
              value={formData.faith_integration.q32_biblical_principles}
              onChange={(val) => updateQuestion('q32', val)}
              onBlur={() => markQuestionCompleted('q32')}
              placeholder="Servant leadership, excellence as worship, generosity, stewardship..."
              maxLength={500}
            />
          </QuestionWrapper>
        )}
      </SectionContainer>
    </>
  );
}
