'use client';

import { useState } from 'react';
import QuestionWrapper from '../question-types/question-wrapper';
import LongTextQuestion from '../question-types/long-text-question';
import ShortTextQuestion from '../question-types/short-text-question';
import MultipleChoiceQuestion from '../question-types/multiple-choice-question';
import { FileUploadQuestion } from '../question-types/file-upload-question';
import SectionContainer from './section-container';
import { UseQuestionnaireFormReturn } from '@/lib/questionnaire/use-questionnaire-form';
import { HelpPanel, HelpContent } from '../help-system';

interface Props {
  clientId: string;
  questionnaireForm: UseQuestionnaireFormReturn;
}

export default function BrandVoiceSection({ clientId, questionnaireForm }: Props) {
  const {
    formData,
    updateQuestion,
    markQuestionCompleted,
    completedQuestions,
  } = questionnaireForm;

  const [helpOpen, setHelpOpen] = useState(false);
  const [currentHelpQuestion, setCurrentHelpQuestion] = useState(20);

  const openHelp = (questionNumber: number) => {
    setCurrentHelpQuestion(questionNumber);
    setHelpOpen(true);
  };

  // Calculate section progress
  const sectionQuestions = ['q20', 'q21', 'q22', 'q23', 'q24'];
  const answeredCount = sectionQuestions.filter(q => 
    completedQuestions.has(q)
  ).length;

  return (
    <>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)}>
        <HelpContent questionNumber={currentHelpQuestion} />
      </HelpPanel>

      <SectionContainer
        sectionNumber={5}
        title="Brand Voice & Communication"
        description="Define how your brand communicates and sounds"
        estimatedTime="7 minutes"
        currentProgress={{ answered: answeredCount, total: 5 }}
      >
        <QuestionWrapper
          questionNumber={20}
          questionText="What is your brand voice type?"
          isRequired={true}
          onHelpClick={() => openHelp(20)}
          estimatedTime="1 min"
        >
          <MultipleChoiceQuestion
            value={formData.brand_voice.q20_voice_type}
            onChange={(val) => {
              updateQuestion('q20', val);
              if (val) markQuestionCompleted('q20');
            }}
            options={[
              { value: 'professional_authoritative', label: 'Professional & Authoritative' },
              { value: 'friendly_conversational', label: 'Friendly & Conversational' },
              { value: 'bold_direct', label: 'Bold & Direct' },
              { value: 'warm_nurturing', label: 'Warm & Nurturing' },
              { value: 'sophisticated_polished', label: 'Sophisticated & Polished' }
            ]}
            allowMultiple={false}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={21}
          questionText="What personality words describe your brand?"
          isRequired={true}
          onHelpClick={() => openHelp(21)}
          estimatedTime="1 min"
        >
          <ShortTextQuestion
            value={formData.brand_voice.q21_personality_words}
            onChange={(val) => updateQuestion('q21', val)}
            onBlur={() => markQuestionCompleted('q21')}
            placeholder="Bold, Trustworthy, Results-Driven"
            maxLength={300}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={22}
          questionText="What are your signature phrases?"
          isRequired={true}
          onHelpClick={() => openHelp(22)}
          estimatedTime="2 min"
        >
          <LongTextQuestion
            value={formData.brand_voice.q22_signature_phrases}
            onChange={(val) => updateQuestion('q22', val)}
            onBlur={() => markQuestionCompleted('q22')}
            placeholder="'Let's cut the BS.' 'Here's what actually works.' 'No fluff, just results.'"
            minLength={20}
            maxLength={500}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={23}
          questionText="What topics should you avoid?"
          isRequired={true}
          onHelpClick={() => openHelp(23)}
          estimatedTime="1 min"
        >
          <LongTextQuestion
            value={formData.brand_voice.q23_avoid_topics}
            onChange={(val) => updateQuestion('q23', val)}
            onBlur={() => markQuestionCompleted('q23')}
            placeholder="Never mention specific competitor names, avoid technical jargon, no 'growth hacking'..."
            minLength={20}
            maxLength={500}
          />
        </QuestionWrapper>

        <QuestionWrapper
          questionNumber={24}
          questionText="Upload brand assets (optional)"
          isRequired={false}
          onHelpClick={() => openHelp(24)}
          estimatedTime="2 min"
        >
          <FileUploadQuestion
            value={formData.brand_voice.q24_brand_assets || []}
            onChange={(files) => {
              updateQuestion('q24', files);
              if (files.length > 0) markQuestionCompleted('q24');
            }}
            label="Brand Assets"
            description="Upload logos, style guides, color palettes, or any brand materials (optional)"
            maxFiles={5}
            maxSizeInMB={10}
            acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
          />
        </QuestionWrapper>
      </SectionContainer>
    </>
  );
}
