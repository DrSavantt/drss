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

export default function DreamOutcomeSection({ clientId, questionnaireForm }: Props) {
  const {
    formData,
    updateQuestion,
    markQuestionCompleted,
    completedQuestions,
  } = questionnaireForm;

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(6);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Calculate section progress
  const sectionQuestions = ['q6', 'q7', 'q8', 'q9', 'q10'];
  const answeredCount = sectionQuestions.filter(q => 
    completedQuestions.has(q)
  ).length;

  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        <HelpContent questionNumber={currentHelpQuestion} />
      </HelpPanel>

      <SectionContainer
        sectionNumber={2}
        title="Dream Outcome & Value Equation"
        description="Define the transformation and value you deliver"
        estimatedTime="8 minutes"
        currentProgress={{ answered: answeredCount, total: 5 }}
      >
        <QuestionWrapper
          questionNumber={6}
          questionText="What is the dream outcome for your customer?"
          isRequired={true}
          onHelpClick={() => openHelp(6)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.dream_outcome.q6_dream_outcome}
            onChange={(val) => updateQuestion('q6', val)}
            onBlur={() => markQuestionCompleted('q6')}
            placeholder="A predictable, profitable business that runs without them being there 80 hours/week..."
            minLength={50}
            maxLength={1000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={7}
          questionText="What status will they gain?"
          isRequired={true}
          onHelpClick={() => openHelp(7)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.dream_outcome.q7_status}
            onChange={(val) => updateQuestion('q7', val)}
            onBlur={() => markQuestionCompleted('q7')}
            placeholder="Their spouse sees them as successful, peers respect them, they're invited to speak..."
            minLength={30}
            maxLength={500}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={8}
          questionText="How long until they see results?"
          isRequired={true}
          onHelpClick={() => openHelp(8)}
          estimatedTime="1 min"
        >
          <ShortTextQuestion
            value={formData.dream_outcome.q8_time_to_result}
            onChange={(val) => updateQuestion('q8', val)}
            onBlur={() => markQuestionCompleted('q8')}
            placeholder="90 days to see significant results"
            maxLength={300}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={9}
          questionText="What effort/sacrifice is required?"
          isRequired={true}
          onHelpClick={() => openHelp(9)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.dream_outcome.q9_effort_sacrifice}
            onChange={(val) => updateQuestion('q9', val)}
            onBlur={() => markQuestionCompleted('q9')}
            placeholder="2-3 hours per week initially, then 1 hour/week for maintenance..."
            minLength={30}
            maxLength={500}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={10}
          questionText="What proof/track record do you have?"
          isRequired={true}
          onHelpClick={() => openHelp(10)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.dream_outcome.q10_proof}
            onChange={(val) => updateQuestion('q10', val)}
            onBlur={() => markQuestionCompleted('q10')}
            placeholder="42 clients served with 89% achieving ROI within 60 days. Average return: 3.2x investment..."
            minLength={50}
            maxLength={1000}
          />
        </QuestionWrapper>
      </SectionContainer>
    </>
  );
}
