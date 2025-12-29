'use client';

import { useState } from 'react';
import QuestionWrapper from '../question-types/question-wrapper';
import LongTextQuestion from '../question-types/long-text-question';
import SectionContainer from './section-container';
import { UseQuestionnaireFormReturn } from '@/lib/questionnaire/use-questionnaire-form';
import { HelpPanel, HelpContent } from '../help-system';

interface Props {
  clientId: string;
  questionnaireForm: UseQuestionnaireFormReturn;
}

export default function SolutionMethodologySection({ clientId, questionnaireForm }: Props) {
  const {
    formData,
    updateQuestion,
    markQuestionCompleted,
    completedQuestions,
  } = questionnaireForm;

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(16);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Calculate section progress
  const sectionQuestions = ['q16', 'q17', 'q18', 'q19'];
  const answeredCount = sectionQuestions.filter(q => 
    completedQuestions.has(q)
  ).length;

  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        <HelpContent questionNumber={currentHelpQuestion} />
      </HelpPanel>

      <SectionContainer
        sectionNumber={4}
        title="Solution & Methodology"
        description="Define what you offer and how you deliver it"
        estimatedTime="6 minutes"
        currentProgress={{ answered: answeredCount, total: 4 }}
      >
        <QuestionWrapper
          questionNumber={16}
          questionText="What is your core offer?"
          isRequired={true}
          onHelpClick={() => openHelp(16)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.solution_methodology.q16_core_offer}
            onChange={(val) => updateQuestion('q16', val)}
            onBlur={() => markQuestionCompleted('q16')}
            placeholder="Done-For-You Marketing System that generates 20+ qualified leads per month..."
            minLength={50}
            maxLength={1000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={17}
          questionText="What is your unique mechanism?"
          isRequired={true}
          onHelpClick={() => openHelp(17)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.solution_methodology.q17_unique_mechanism}
            onChange={(val) => updateQuestion('q17', val)}
            onBlur={() => markQuestionCompleted('q17')}
            placeholder="The 'Build & Release' Model - we build your entire system first, then release it..."
            minLength={50}
            maxLength={1000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={18}
          questionText="How are you different from competitors?"
          isRequired={true}
          onHelpClick={() => openHelp(18)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.solution_methodology.q18_differentiation}
            onChange={(val) => updateQuestion('q18', val)}
            onBlur={() => markQuestionCompleted('q18')}
            placeholder="We're the only agency that owns the implementation risk - if it doesn't work, we refund..."
            minLength={50}
            maxLength={1000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={19}
          questionText="What is your delivery vehicle?"
          isRequired={true}
          onHelpClick={() => openHelp(19)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.solution_methodology.q19_delivery_vehicle}
            onChange={(val) => updateQuestion('q19', val)}
            onBlur={() => markQuestionCompleted('q19')}
            placeholder="90-day implementation program with weekly check-ins and 24/7 Slack support..."
            minLength={30}
            maxLength={500}
          />
        </QuestionWrapper>
      </SectionContainer>
    </>
  );
}
