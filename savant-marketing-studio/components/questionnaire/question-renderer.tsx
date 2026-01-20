'use client';

import { QuestionConfig } from '@/lib/questionnaire/questions-config';
import QuestionWrapper from './question-types/question-wrapper';
import LongTextQuestion from './question-types/long-text-question';
import ShortTextQuestion from './question-types/short-text-question';
import MultipleChoiceQuestion from './question-types/multiple-choice-question';
import { FileUploadQuestion, UploadedFile } from './question-types/file-upload-question';

interface QuestionRendererProps {
  question: QuestionConfig;
  value: string | string[] | UploadedFile[];
  onChange: (value: string | string[] | UploadedFile[]) => void;
  onBlur: () => void;
  onHelpClick: () => void;
  error?: string;
  /** Global question number across all sections (e.g., Q7 instead of section's Q1) */
  globalQuestionNumber?: number;
}

/**
 * Get keyboard hint based on question type
 */
function getKeyboardHint(type: QuestionConfig['type']): string | undefined {
  switch (type) {
    case 'short-text':
      return 'Press Enter ↵';
    case 'long-text':
      return 'Shift + Enter for new line';
    case 'multiple-choice':
    case 'checkbox':
      return undefined; // Selection auto-advances
    case 'file-upload':
      return undefined; // No keyboard hint for file uploads
    default:
      return undefined;
  }
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  onBlur,
  onHelpClick,
  error,
  globalQuestionNumber
}: QuestionRendererProps) {
  
  const renderInput = () => {
    switch (question.type) {
      case 'long-text':
        return (
          <LongTextQuestion
            value={(value as string) || ''}
            onChange={(val) => onChange(val)}
            onBlur={onBlur}
            placeholder={question.placeholder}
            minLength={question.minLength}
            maxLength={question.maxLength}
            error={error}
          />
        );
      
      case 'short-text':
        return (
          <ShortTextQuestion
            value={(value as string) || ''}
            onChange={(val) => onChange(val)}
            onBlur={onBlur}
            placeholder={question.placeholder}
            maxLength={question.maxLength}
            error={error}
          />
        );
      
      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion
            value={(value as string) || ''}
            onChange={(val) => {
              onChange(val);
              // Auto-complete on selection for single choice
              if (val) onBlur();
            }}
            options={question.options || []}
            allowMultiple={false}
            error={error}
          />
        );
      
      case 'checkbox':
        return (
          <MultipleChoiceQuestion
            value={(value as string[]) || []}
            onChange={(val) => {
              onChange(val);
              // Auto-complete when at least one option selected
              if ((val as string[]).length > 0) onBlur();
            }}
            options={question.options || []}
            allowMultiple={true}
            error={error}
          />
        );
      
      case 'file-upload':
        return (
          <FileUploadQuestion
            value={(value as UploadedFile[]) || []}
            onChange={(files) => {
              onChange(files);
              if (files.length > 0) onBlur();
            }}
            label={question.text}
            description={question.fileDescription}
            maxFiles={question.maxFiles || 5}
            maxSizeInMB={question.maxFileSize || 10}
            acceptedTypes={question.acceptedFileTypes}
            error={error}
          />
        );
      
      default:
        return <div className="text-destructive">Unknown question type: {question.type}</div>;
    }
  };
  
  // Use global question number if provided, otherwise fall back to section order
  const displayNumber = globalQuestionNumber ?? question.order;
  
  // Get keyboard hint based on question type
  const keyboardHint = getKeyboardHint(question.type);
  
  return (
    <QuestionWrapper
      questionNumber={displayNumber}
      questionText={question.text}
      isRequired={question.required}
      onHelpClick={onHelpClick}
      keyboardHint={keyboardHint}
    >
      {renderInput()}
    </QuestionWrapper>
  );
}

export default QuestionRenderer;
