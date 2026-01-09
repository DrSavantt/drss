'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedQuestionnaireForm } from './unified-questionnaire-form';
import { submitPublicQuestionnaire, savePublicQuestionnaireProgress } from '@/app/actions/questionnaire';
import type { SectionConfig, QuestionConfig } from '@/lib/questionnaire/questions-config';
import type { QuestionnaireData } from '@/lib/questionnaire/types';
import { toast } from 'sonner';

// ============================================
// PUBLIC FORM THEME HOOK
// Uses separate 'questionnaire-theme' key to stay independent from main app
// This allows public form visitors to have different theme than main app users
// ============================================

type PublicFormTheme = 'light' | 'dark' | 'system';

// Separate key from main app to maintain independence
const THEME_STORAGE_KEY = 'questionnaire-theme';

function usePublicFormTheme() {
  const [theme, setTheme] = useState<PublicFormTheme>('system');
  const [mounted, setMounted] = useState(false);
  const [resolvedDark, setResolvedDark] = useState(false);

  // On mount: sync React state with what inline script already set in DOM
  // The inline script (in app/form/[token]/layout.tsx) reads localStorage and
  // resolves 'system' to 'dark' or 'light' based on system preference.
  // We read from DOM, not localStorage, to avoid state/DOM mismatch that causes
  // the "two clicks required" bug.
  useEffect(() => {
    // Read what the DOM currently has (set by inline script)
    const domIsDark = document.documentElement.classList.contains('dark');
    setResolvedDark(domIsDark);
    
    // Also read the actual stored preference for toggle logic
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      let savedTheme: string | null = stored;
      if (stored.startsWith('"') || stored.startsWith('{')) {
        try {
          savedTheme = JSON.parse(stored);
        } catch (e) {
          // Keep original value if parse fails
        }
      }
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme as PublicFormTheme);
      }
    }
    
    setMounted(true);
  }, []);

  // Apply theme and listen for system changes
  useEffect(() => {
    if (!mounted) return;

    const applyTheme = () => {
      let isDark: boolean;
      
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }
      
      // Apply theme class to <html> element
      // CSS uses :root for dark (default) and .light for light mode
      // We toggle .light class since :root is already dark-styled
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(isDark ? 'dark' : 'light');
      
      setResolvedDark(isDark);
    };

    // Apply immediately
    applyTheme();

    // Listen for system preference changes (only matters when theme is 'system')
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // Persist theme choice
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme, mounted]);

  // Toggle between light and dark (skips system on toggle)
  const toggle = useCallback(() => {
    setTheme(prev => {
      // If currently system, determine what to switch to
      if (prev === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return systemDark ? 'light' : 'dark';
      }
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, []);

  return { 
    theme, 
    setTheme, 
    toggle, 
    mounted, 
    isDark: resolvedDark 
  };
}

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

// Help content structure (embedded in questions.help_content JSONB column)
interface HelpContent {
  title: string | null;
  where_to_find: string[] | null;
  how_to_extract: string[] | null;
  good_example: string | null;
  weak_example: string | null;
  quick_tip: string | null;
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
  help?: HelpContent | null;  // Now uses JSONB structure, not separate table
  help_content?: HelpContent | null;  // Alternative name from DB
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
 * - Theme control (dark/light/system toggle stored in localStorage)
 * - Uses shared 'theme' key to stay in sync with global ThemeProvider
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
  
  // Independent theme control for public form
  const { isDark, toggle: toggleTheme, mounted } = usePublicFormTheme();
  
  // State
  // Initial data is now provided by the server, properly formatted
  const [existingData] = useState<QuestionnaireData | null>(
    client.intake_responses as QuestionnaireData | null
  );

  // Transform database format to client format
  const transformedSections = useMemo(() => 
    sections.filter(s => s.enabled).map(transformSection),
    [sections]
  );
  
  const transformedQuestions = useMemo(() => 
    questions.filter(q => q.enabled).map(transformQuestion),
    [questions]
  );

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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <PublicFormHeader />
        <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-32">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-2 bg-muted rounded-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
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
          isDarkMode={isDark}
          onToggleTheme={toggleTheme}
          layout="pills"
          autoSave={true}
          autoSaveDelay={3000}
        />
      </main>
    </div>
  );
}

/**
 * Header component for public form
 */
function PublicFormHeader() {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-40 backdrop-blur-xl bg-card/95">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-xl font-bold text-primary">DRSS Marketing</h1>
        <p className="text-sm text-muted-foreground">Client Onboarding</p>
      </div>
    </header>
  );
}
