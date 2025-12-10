'use client';

import { useState } from 'react';
import QuestionWrapper from '../question-types/question-wrapper';
import LongTextQuestion from '../question-types/long-text-question';
import MultipleChoiceQuestion from '../question-types/multiple-choice-question';
import SectionContainer from './section-container';
import { useQuestionnaireForm } from '@/lib/questionnaire/use-questionnaire-form';
import { HelpPanel, HelpContent } from '../help-system';

interface Props {
  clientId: string;
}

export default function AvatarDefinitionSection({ clientId }: Props) {
  const {
    formData,
    updateQuestion,
    getQuestionError,
    markQuestionCompleted,
    completedQuestions,
  } = useQuestionnaireForm(clientId);

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(1);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Calculate section progress
  const sectionQuestions = ['q1', 'q2', 'q3', 'q4', 'q5'];
  const answeredCount = sectionQuestions.filter(q => 
    completedQuestions.has(q)
  ).length;

  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        <HelpContent questionNumber={currentHelpQuestion} />
      </HelpPanel>

      <SectionContainer
        sectionNumber={1}
        title="Avatar Definition"
        description="Define your ideal customer with surgical precision"
        estimatedTime="7 minutes"
        currentProgress={{ answered: answeredCount, total: 5 }}
      >
        <QuestionWrapper
          questionNumber={1}
          questionText="Who is your IDEAL customer? Be specific."
          isRequired={true}
          onHelpClick={() => openHelp(1)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.avatar_definition.q1_ideal_customer}
            onChange={(val) => updateQuestion('q1', val)}
            onBlur={() => markQuestionCompleted('q1')}
            placeholder="Business owners making $1M-$10M annually who struggle with..."
            minLength={50}
            maxLength={1000}
            error={getQuestionError('q1')}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={2}
          questionText="Which criteria does your ideal customer meet? Check all that apply."
          isRequired={true}
          onHelpClick={() => openHelp(2)}
          estimatedTime="1 min"
        >
          <MultipleChoiceQuestion
            value={formData.avatar_definition.q2_avatar_criteria}
            onChange={(val) => {
              updateQuestion('q2', val);
              if ((val as string[]).length > 0) markQuestionCompleted('q2');
            }}
            options={[
              { value: 'growing', label: 'Market is growing' },
              { value: 'afford', label: 'Can afford premium pricing' },
              { value: 'findable', label: 'Can be targeted specifically' },
              { value: 'pain', label: 'In significant pain' },
              { value: 'all_four', label: 'All four of the above' },
            ]}
            allowMultiple={true}
            error={getQuestionError('q2')}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={3}
          questionText="Demographics of your ideal customer"
          isRequired={true}
          onHelpClick={() => openHelp(3)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.avatar_definition.q3_demographics}
            onChange={(val) => updateQuestion('q3', val)}
            onBlur={() => markQuestionCompleted('q3')}
            placeholder="Male, 38-52 years old, suburban US, household income $150K-$300K..."
            minLength={30}
            maxLength={500}
            error={getQuestionError('q3')}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={4}
          questionText="Psychographics of your ideal customer"
          isRequired={true}
          onHelpClick={() => openHelp(4)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.avatar_definition.q4_psychographics}
            onChange={(val) => updateQuestion('q4', val)}
            onBlur={() => markQuestionCompleted('q4')}
            placeholder="Values control and freedom, fears failure and looking incompetent..."
            minLength={30}
            maxLength={500}
            error={getQuestionError('q4')}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={5}
          questionText="Where does your ideal customer spend time?"
          isRequired={true}
          onHelpClick={() => openHelp(5)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.avatar_definition.q5_platforms}
            onChange={(val) => updateQuestion('q5', val)}
            onBlur={() => markQuestionCompleted('q5')}
            placeholder="LinkedIn daily, listens to 'My First Million' podcast, attends local BNI meetings..."
            minLength={20}
            maxLength={500}
            error={getQuestionError('q5')}
          />
        </QuestionWrapper>
      </SectionContainer>
    </>
  );
}
