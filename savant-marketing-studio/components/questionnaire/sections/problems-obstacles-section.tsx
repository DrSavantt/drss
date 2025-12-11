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

export default function ProblemsObstaclesSection({ clientId, questionnaireForm }: Props) {
  const {
    formData,
    updateQuestion,
    markQuestionCompleted,
    completedQuestions,
  } = questionnaireForm;

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(11);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Calculate section progress
  const sectionQuestions = ['q11', 'q12', 'q13', 'q14', 'q15'];
  const answeredCount = sectionQuestions.filter(q => 
    completedQuestions.has(q)
  ).length;

  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        <HelpContent questionNumber={currentHelpQuestion} />
      </HelpPanel>

      <SectionContainer
        sectionNumber={3}
        title="Problems & Obstacles"
        description="Identify the pain points and roadblocks your customers face"
        estimatedTime="7 minutes"
        currentProgress={{ answered: answeredCount, total: 5 }}
      >
        <QuestionWrapper
          questionNumber={11}
          questionText="What external problems do your customers face?"
          isRequired={true}
          onHelpClick={() => openHelp(11)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.problems_obstacles.q11_external_problems}
            onChange={(val) => updateQuestion('q11', val)}
            onBlur={() => markQuestionCompleted('q11')}
            placeholder="Inconsistent lead flow, can't keep good employees, too many tasks..."
            minLength={50}
            maxLength={1000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={12}
          questionText="What internal problems do they struggle with?"
          isRequired={true}
          onHelpClick={() => openHelp(12)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.problems_obstacles.q12_internal_problems}
            onChange={(val) => updateQuestion('q12', val)}
            onBlur={() => markQuestionCompleted('q12')}
            placeholder="Feels like a fraud, worried about making payroll, stressed about competition..."
            minLength={50}
            maxLength={1000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={13}
          questionText="What philosophical problems exist? (Optional)"
          onHelpClick={() => openHelp(13)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.problems_obstacles.q13_philosophical_problems}
            onChange={(val) => updateQuestion('q13', val)}
            onBlur={() => markQuestionCompleted('q13')}
            placeholder="Business owners shouldn't have to work 80 hour weeks to succeed..."
            maxLength={1000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={14}
          questionText="What past failures have they experienced?"
          isRequired={true}
          onHelpClick={() => openHelp(14)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.problems_obstacles.q14_past_failures}
            onChange={(val) => updateQuestion('q14', val)}
            onBlur={() => markQuestionCompleted('q14')}
            placeholder="Hired 2-3 agencies that promised results but delivered nothing..."
            minLength={50}
            maxLength={1000}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={15}
          questionText="What limiting beliefs do they have?"
          isRequired={true}
          onHelpClick={() => openHelp(15)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.problems_obstacles.q15_limiting_beliefs}
            onChange={(val) => updateQuestion('q15', val)}
            onBlur={() => markQuestionCompleted('q15')}
            placeholder="'Marketing doesn't work for my industry', 'I'm not good at sales'..."
            minLength={30}
            maxLength={500}
          />
        </QuestionWrapper>
      </SectionContainer>
    </>
  );
}
