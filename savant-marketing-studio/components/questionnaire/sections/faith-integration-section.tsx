'use client';

import { useState } from 'react';
import QuestionWrapper from '../question-types/question-wrapper';
import LongTextQuestion from '../question-types/long-text-question';
import MultipleChoiceQuestion from '../question-types/multiple-choice-question';
import SectionContainer from './section-container';
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form';
import { HelpPanel, HelpContent } from '../help-system';
import { shouldShowQuestion } from '@/lib/questionnaire/conditional-logic';

interface Props {
  clientId: string;
}

export default function FaithIntegrationSection({ clientId }: Props) {
  const {
    formData,
    updateQuestion,
    getQuestionError,
    markQuestionCompleted,
    completedQuestions,
  } = useQuestionnaireForm(clientId);

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(28);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Check if Q29 and Q30 should be shown (conditional logic)
  const showQ29 = shouldShowQuestion('q29', formData);
  const showQ30 = shouldShowQuestion('q30', formData);

  // Calculate section progress (only count visible questions)
  const sectionQuestions = ['q28'];
  if (showQ29) sectionQuestions.push('q29');
  if (showQ30) sectionQuestions.push('q30');
  
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
          questionNumber={28}
          questionText="How does faith integrate with your business?"
          onHelpClick={() => openHelp(28)}
          estimatedTime="1 min"
        >
          <MultipleChoiceQuestion
            value={formData.faith_integration.q28_faith_preference}
            onChange={(val) => {
              updateQuestion('q28', val);
              if (val) markQuestionCompleted('q28');
            }}
            options={[
              { value: 'explicit', label: 'Yes - Explicitly faith-forward in marketing' },
              { value: 'values_aligned', label: 'Yes - Values-aligned but subtle' },
              { value: 'separate', label: 'No - Keep faith and business separate' }
            ]}
            allowMultiple={false}
            error={getQuestionError('q28')}
          />
        </QuestionWrapper>

        {showQ29 && (
          <QuestionWrapper
            questionNumber={29}
            questionText="What is your faith-driven mission?"
            onHelpClick={() => openHelp(29)}
            estimatedTime="1 min"
          >
            <LongTextQuestion
              value={formData.faith_integration.q29_faith_mission}
              onChange={(val) => updateQuestion('q29', val)}
              onBlur={() => markQuestionCompleted('q29')}
              placeholder="I believe business is ministry. My goal is to serve kingdom-minded entrepreneurs..."
              maxLength={1000}
              error={getQuestionError('q29')}
            />
          </QuestionWrapper>
        )}

        {showQ30 && (
          <QuestionWrapper
            questionNumber={30}
            questionText="What biblical principles guide your work?"
            onHelpClick={() => openHelp(30)}
            estimatedTime="1 min"
          >
            <LongTextQuestion
              value={formData.faith_integration.q30_biblical_principles}
              onChange={(val) => updateQuestion('q30', val)}
              onBlur={() => markQuestionCompleted('q30')}
              placeholder="Servant leadership, excellence as worship, generosity, stewardship..."
              maxLength={500}
              error={getQuestionError('q30')}
            />
          </QuestionWrapper>
        )}
      </SectionContainer>
    </>
  );
}
