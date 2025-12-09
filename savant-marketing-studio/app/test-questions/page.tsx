'use client';

import { useState } from 'react';
import QuestionWrapper from '@/components/questionnaire/question-types/question-wrapper';
import LongTextQuestion from '@/components/questionnaire/question-types/long-text-question';
import MultipleChoiceQuestion from '@/components/questionnaire/question-types/multiple-choice-question';
import { HelpPanel, HelpContent } from '@/components/questionnaire/help-system';

export default function TestQuestionsPage() {
  const [shortAnswer, setShortAnswer] = useState('');
  const [longAnswer, setLongAnswer] = useState('');
  const [singleChoice, setSingleChoice] = useState('');
  const [multipleChoice, setMultipleChoice] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(1);

  const industryOptions = [
    { value: 'tech', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'retail', label: 'Retail' },
    { value: 'other', label: 'Other' },
  ];

  const goalOptions = [
    { value: 'brand_awareness', label: 'Increase brand awareness' },
    { value: 'lead_gen', label: 'Generate more leads' },
    { value: 'sales', label: 'Boost sales' },
    { value: 'engagement', label: 'Improve customer engagement' },
  ];

  const handleHelpClick = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        <HelpContent questionNumber={currentHelpQuestion} />
      </HelpPanel>

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Question Type Components + Help System Test
            </h1>
            <p className="text-silver">
              Click the (?) button on any question to see the help panel slide out
            </p>
          </div>

        <div className="bg-surface rounded-lg border border-border p-8">
          <QuestionWrapper
            questionNumber={1}
            questionText="Who is your IDEAL customer?"
            isRequired={true}
            onHelpClick={() => handleHelpClick(1)}
            estimatedTime="5 minutes"
          >
            <LongTextQuestion
              value={shortAnswer}
              onChange={setShortAnswer}
              placeholder="Describe your ideal customer in detail..."
              maxLength={1000}
            />
          </QuestionWrapper>

          <QuestionWrapper
            questionNumber={2}
            questionText="Which criteria does your ideal customer meet?"
            isRequired={true}
            onHelpClick={() => handleHelpClick(2)}
            estimatedTime="2 minutes"
          >
            <MultipleChoiceQuestion
              value={singleChoice}
              onChange={(value) => setSingleChoice(value as string)}
              options={[
                { value: 'growing', label: 'Market is growing' },
                { value: 'afford', label: 'Can afford premium pricing' },
                { value: 'targetable', label: 'Can be targeted specifically' },
                { value: 'all', label: 'All four of the above' },
              ]}
              allowMultiple={false}
            />
          </QuestionWrapper>

          <QuestionWrapper
            questionNumber={3}
            questionText="Demographics of your ideal customer"
            isRequired={true}
            onHelpClick={() => handleHelpClick(3)}
            estimatedTime="3 minutes"
          >
            <LongTextQuestion
              value={longAnswer}
              onChange={setLongAnswer}
              placeholder="Age, location, gender, income level..."
              maxLength={1000}
            />
          </QuestionWrapper>

          <QuestionWrapper
            questionNumber={4}
            questionText="Psychographics of your ideal customer"
            isRequired={false}
            onHelpClick={() => handleHelpClick(4)}
            estimatedTime="3 minutes"
          >
            <MultipleChoiceQuestion
              value={multipleChoice}
              onChange={(value) => setMultipleChoice(value as string[])}
              options={goalOptions}
              allowMultiple={true}
            />
          </QuestionWrapper>

          <QuestionWrapper
            questionNumber={5}
            questionText="Where does your ideal customer spend time?"
            isRequired={false}
            onHelpClick={() => handleHelpClick(5)}
            estimatedTime="2 minutes"
          >
            <MultipleChoiceQuestion
              value={multipleChoice}
              onChange={(value) => setMultipleChoice(value as string[])}
              options={industryOptions}
              allowMultiple={true}
            />
          </QuestionWrapper>

          <div className="mt-8 pt-8 border-t border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Current Values (Debug)
            </h2>
            <div className="space-y-2 text-sm font-mono bg-background p-4 rounded-lg">
              <div>
                <span className="text-silver">Q1 (Short Text):</span>{' '}
                <span className="text-foreground">
                  {shortAnswer || '(empty)'}
                </span>
              </div>
              <div>
                <span className="text-silver">Q2 (Long Text):</span>{' '}
                <span className="text-foreground">
                  {longAnswer || '(empty)'}
                </span>
              </div>
              <div>
                <span className="text-silver">Q3 (Single Choice):</span>{' '}
                <span className="text-foreground">
                  {singleChoice || '(empty)'}
                </span>
              </div>
              <div>
                <span className="text-silver">Q4 (Multiple Choice):</span>{' '}
                <span className="text-foreground">
                  {multipleChoice.length > 0
                    ? multipleChoice.join(', ')
                    : '(empty)'}
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
