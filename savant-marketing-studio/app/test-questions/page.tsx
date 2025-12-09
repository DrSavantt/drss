'use client';

import { useState } from 'react';
import QuestionWrapper from '@/components/questionnaire/question-types/question-wrapper';
import ShortTextQuestion from '@/components/questionnaire/question-types/short-text-question';
import LongTextQuestion from '@/components/questionnaire/question-types/long-text-question';
import MultipleChoiceQuestion from '@/components/questionnaire/question-types/multiple-choice-question';

export default function TestQuestionsPage() {
  const [shortAnswer, setShortAnswer] = useState('');
  const [longAnswer, setLongAnswer] = useState('');
  const [singleChoice, setSingleChoice] = useState('');
  const [multipleChoice, setMultipleChoice] = useState<string[]>([]);

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
    alert(`Help for Question ${questionNumber}`);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Question Type Components Test
          </h1>
          <p className="text-silver">
            Testing all 4 question type components with sample data
          </p>
        </div>

        <div className="bg-surface rounded-lg border border-border p-8">
          <QuestionWrapper
            questionNumber={1}
            questionText="What is your company name?"
            isRequired={true}
            onHelpClick={() => handleHelpClick(1)}
            estimatedTime="30 seconds"
          >
            <ShortTextQuestion
              value={shortAnswer}
              onChange={setShortAnswer}
              placeholder="Enter your company name"
              maxLength={100}
            />
          </QuestionWrapper>

          <QuestionWrapper
            questionNumber={2}
            questionText="Tell us about your business and what makes it unique"
            isRequired={true}
            onHelpClick={() => handleHelpClick(2)}
            estimatedTime="2-3 minutes"
          >
            <LongTextQuestion
              value={longAnswer}
              onChange={setLongAnswer}
              placeholder="Describe your business, target audience, unique value proposition..."
              maxLength={1000}
            />
          </QuestionWrapper>

          <QuestionWrapper
            questionNumber={3}
            questionText="What industry does your business operate in?"
            isRequired={true}
            onHelpClick={() => handleHelpClick(3)}
            estimatedTime="10 seconds"
          >
            <MultipleChoiceQuestion
              value={singleChoice}
              onChange={(value) => setSingleChoice(value as string)}
              options={industryOptions}
              allowMultiple={false}
            />
          </QuestionWrapper>

          <QuestionWrapper
            questionNumber={4}
            questionText="What are your primary marketing goals? (Select all that apply)"
            isRequired={false}
            onHelpClick={() => handleHelpClick(4)}
            estimatedTime="30 seconds"
          >
            <MultipleChoiceQuestion
              value={multipleChoice}
              onChange={(value) => setMultipleChoice(value as string[])}
              options={goalOptions}
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
  );
}
