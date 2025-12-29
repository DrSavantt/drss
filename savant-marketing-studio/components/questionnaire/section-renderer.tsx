'use client';

import { useState } from 'react';
import type { SectionConfig } from '@/lib/questionnaire/questions-config';
import { QuestionnaireConfigLike } from '@/lib/questionnaire/questionnaire-config-context';
import { QuestionRenderer } from './question-renderer';
import SectionContainer from './sections/section-container';
import { HelpPanel } from './help-system';
import { ConfigHelpContent } from './help-system/config-help-content';
import { UploadedFile } from './question-types/file-upload-question';

interface SectionRendererProps {
  section: SectionConfig;
  formData: Record<string, string | string[] | UploadedFile[]>;
  updateQuestion: (questionId: string, value: string | string[] | UploadedFile[]) => void;
  markQuestionCompleted: (questionId: string) => void;
  completedQuestions: Set<string>;
  errors?: Record<string, string>;
  config: QuestionnaireConfigLike; // Required: use database config
}

export function SectionRenderer({
  section,
  formData,
  updateQuestion,
  markQuestionCompleted,
  completedQuestions,
  errors = {},
  config
}: SectionRendererProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestionId, setCurrentHelpQuestionId] = useState<string | null>(null);
  
  const openHelp = (questionId: string) => {
    setCurrentHelpQuestionId(questionId);
    setHelpOpen(true);
  };
  
  // Get questions from database config
  const allQuestions = config.getQuestionsForSection(section.id);
  const visibleQuestions = allQuestions.filter(q => 
    config.shouldShowQuestion(q.id, formData)
  );
  
  // Calculate progress based on visible questions
  const answeredCount = visibleQuestions.filter(q => 
    completedQuestions.has(q.key)
  ).length;
  
  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        {currentHelpQuestionId && (
          <ConfigHelpContent questionId={currentHelpQuestionId} config={config} />
        )}
      </HelpPanel>

      <SectionContainer
        sectionNumber={section.id}
        title={section.title}
        description={section.description}
        estimatedTime={`${section.estimatedMinutes} minutes`}
        currentProgress={{ answered: answeredCount, total: visibleQuestions.length }}
      >
        {visibleQuestions.map(question => (
          <QuestionRenderer
            key={question.id}
            question={question}
            value={formData[question.id] as string | string[] | UploadedFile[]}
            onChange={(val) => updateQuestion(question.key, val)}
            onBlur={() => markQuestionCompleted(question.key)}
            onHelpClick={() => openHelp(question.id)}
            error={errors[question.id]}
          />
        ))}
      </SectionContainer>
    </>
  );
}

export default SectionRenderer;

