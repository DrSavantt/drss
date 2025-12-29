'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedQuestionnaireForm } from './unified-questionnaire-form';
import { submitPublicQuestionnaire, savePublicQuestionnaireProgress } from '@/app/actions/questionnaire';
import type { SectionConfig, QuestionConfig } from '@/lib/questionnaire/questions-config';
import type { QuestionnaireData } from '@/lib/questionnaire/types';
import { toast } from 'sonner';

// Database format types (snake_case from server)
interface DatabaseSection {
  id: number;
  key: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  sort_order: number;
  enabled: boolean;
}

interface DatabaseQuestion {
  id: string;
  section_id: number;
  question_key: string;
  sort_order: number;
  text: string;
  type: string;
  required: boolean;
  enabled: boolean;
  min_length: number | null;
  max_length: number | null;
  placeholder: string | null;
  options: { value: string; label: string }[] | null;
  conditional_on: { questionId: string; notEquals?: string; equals?: string } | null;
  accepted_file_types: string[] | null;
  max_file_size: number | null;
  max_files: number | null;
  file_description: string | null;
  help?: {
    id: number;
    question_id: string;
    title: string | null;
    where_to_find: string[] | null;
    how_to_extract: string[] | null;
    good_example: string | null;
    weak_example: string | null;
    quick_tip: string | null;
  };
}

interface Client {
  id: string;
  name: string;
  email?: string | null;
  intake_responses?: Record<string, unknown> | null;
  user_id: string;
}

interface PublicFormWrapperProps {
  client: Client;
  token: string;
  sections: DatabaseSection[];
  questions: DatabaseQuestion[];
}

// Transform database format to client format
function transformSection(s: DatabaseSection): SectionConfig {
  return {
    id: s.id,
    key: s.key,
    title: s.title,
    description: s.description || '',
    estimatedMinutes: s.estimated_minutes || 5,
    enabled: s.enabled,
  };
}

function transformQuestion(q: DatabaseQuestion): QuestionConfig {
  return {
    id: q.id,
    key: q.question_key,
    sectionId: q.section_id,
    order: q.sort_order,
    text: q.text,
    type: q.type as QuestionConfig['type'],
    required: q.required,
    enabled: q.enabled,
    minLength: q.min_length ?? undefined,
    maxLength: q.max_length ?? undefined,
    placeholder: q.placeholder ?? undefined,
    options: q.options ?? undefined,
    conditionalOn: q.conditional_on ?? undefined,
    acceptedFileTypes: q.accepted_file_types ?? undefined,
    maxFileSize: q.max_file_size ?? undefined,
    maxFiles: q.max_files ?? undefined,
    fileDescription: q.file_description ?? undefined,
    helpTitle: q.help?.title ?? undefined,
    helpWhereToFind: q.help?.where_to_find ?? undefined,
    helpHowToExtract: q.help?.how_to_extract ?? undefined,
    helpGoodExample: q.help?.good_example ?? undefined,
    helpWeakExample: q.help?.weak_example ?? undefined,
    helpQuickTip: q.help?.quick_tip ?? undefined,
  };
}

/**
 * Public form wrapper that uses the UnifiedQuestionnaireForm.
 * This replaces the old PublicQuestionnaireForm with the unified component.
 * 
 * Features:
 * - Independent theme control (dark/light toggle stored in localStorage)
 * - Database persistence (saves via server actions, loads from DB on mount)
 * - Auto-save functionality
 */
export function PublicFormWrapper({
  client,
  token,
  sections,
  questions,
}: PublicFormWrapperProps) {
  const router = useRouter();
  
  // State
  // Initial data is now provided by the server, properly formatted
  const [existingData] = useState<QuestionnaireData | null>(
    client.intake_responses as QuestionnaireData | null
  );
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Transform database format to client format
  const transformedSections = useMemo(() => 
    sections.filter(s => s.enabled).map(transformSection),
    [sections]
  );
  
  const transformedQuestions = useMemo(() => 
    questions.filter(q => q.enabled).map(transformQuestion),
    [questions]
  );

  // Load theme preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('questionnaire_theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
  }, []);

  // Toggle theme with persistence
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('questionnaire_theme', next);
      return next;
    });
  }, []);

  // Save handler - auto-save draft via server action
  const handleSave = useCallback(async (data: QuestionnaireData) => {
    try {
      await savePublicQuestionnaireProgress(token, data);
    } catch (error) {
      console.error('Failed to save progress:', error);
      throw error;
    }
  }, [token]);

  // Submit handler - final submission via server action
  const handleSubmit = useCallback(async (data: QuestionnaireData) => {
    try {
      const result = await submitPublicQuestionnaire(token, data);
      
      if (result.success) {
        toast.success('Questionnaire submitted successfully!');
        // Redirect to completion page
        router.push(`/form/${token}/complete`);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      toast.error('Failed to submit questionnaire. Please try again.');
      throw error;
    }
  }, [token, router]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-background transition-colors">
        <PublicFormHeader />
        <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-32">
          <UnifiedQuestionnaireForm
            mode="public"
            clientId={client.id}
            clientName={client.name}
            token={token}
            sections={transformedSections}
            questions={transformedQuestions}
            initialData={existingData}
            onSave={handleSave}
            onSubmit={handleSubmit}
            showThemeToggle={true}
            showHeader={true}
            isDarkMode={theme === 'dark'}
            onToggleTheme={toggleTheme}
            layout="pills"
            autoSave={true}
            autoSaveDelay={3000}
          />
        </main>
      </div>
    </div>
  );
}

/**
 * Header component for public form
 */
function PublicFormHeader() {
  return (
    <header className="border-b border-border bg-surface sticky top-0 z-40 backdrop-blur-xl bg-surface/95">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-xl font-bold text-red-primary">DRSS Marketing</h1>
        <p className="text-sm text-silver">Client Onboarding</p>
      </div>
    </header>
  );
}
