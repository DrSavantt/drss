'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { UnifiedQuestionnaireForm } from '@/components/questionnaire';
import type { SectionConfig, QuestionConfig } from '@/lib/questionnaire/questions-config';
import type { QuestionnaireData } from '@/lib/questionnaire/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface EmbeddedQuestionnaireFormProps {
  clientId: string;
  clientName: string;
  userId?: string; // Optional - will be fetched if not provided
  initialData?: QuestionnaireData | null;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Embedded Questionnaire Form for use within the admin dashboard.
 * 
 * Features:
 * - Loads existing responses from database on mount
 * - Auto-saves to database via API
 * - localStorage is used as backup only
 */
export function EmbeddedQuestionnaireForm({
  clientId,
  clientName,
  userId: userIdProp,
  initialData,
  onComplete,
  onCancel,
}: EmbeddedQuestionnaireFormProps) {
  const [dbSections, setDbSections] = useState<DatabaseSection[]>([]);
  const [dbQuestions, setDbQuestions] = useState<DatabaseQuestion[]>([]);
  const [userId, setUserId] = useState<string>(userIdProp || '');
  const [existingData, setExistingData] = useState<QuestionnaireData | null | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform database format to client format
  const sections = useMemo(() => 
    dbSections.filter(s => s.enabled).map(transformSection),
    [dbSections]
  );
  
  const questions = useMemo(() => 
    dbQuestions.filter(q => q.enabled).map(transformQuestion),
    [dbQuestions]
  );

  // Fetch config, user, and existing responses on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch config, user, and existing responses in parallel
        // Pass clientId to get client-specific overrides applied
        const [configResponse, userResponse, responsesResponse] = await Promise.all([
          fetch(`/api/questionnaire-config?clientId=${clientId}`),
          !userIdProp ? fetch('/api/user') : Promise.resolve(null),
          // Only fetch existing responses if no initialData provided
          !initialData ? fetch(`/api/questionnaire-response/${clientId}/latest`) : Promise.resolve(null),
        ]);
        
        if (!configResponse.ok) {
          throw new Error('Failed to fetch questionnaire config');
        }
        
        const configData = await configResponse.json();
        setDbSections(configData.sections || []);
        setDbQuestions(configData.questions || []);
        
        // Set user ID if fetched
        if (userResponse) {
          const userData = await userResponse.json();
          if (userData.id) {
            setUserId(userData.id);
          }
        }

        // Set existing responses from database
        if (responsesResponse && responsesResponse.ok) {
          const responseData = await responsesResponse.json();
          if (responseData.data?.response_data) {
            setExistingData(responseData.data.response_data);
          }
        }
      } catch (err) {
        console.error('Failed to load questionnaire:', err);
        setError('Failed to load questionnaire. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [userIdProp, clientId, initialData]);

  // Save handler - saves draft to database via API
  const handleSave = useCallback(async (data: QuestionnaireData) => {
    const response = await fetch('/api/questionnaire-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        response_data: data,
        status: 'draft',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save progress');
    }

  }, [clientId]);

  // Submit handler - marks as completed
  const handleSubmit = useCallback(async (data: QuestionnaireData) => {
    // First save the latest data
    await handleSave(data);
    
    // Then submit (change status to completed)
    const response = await fetch(`/api/questionnaire-response/${clientId}/submit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submitted_by: 'admin' }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to submit questionnaire');
    }
    
    onComplete?.();
  }, [clientId, handleSave, onComplete]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading questionnaire...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No questionnaire sections configured.
      </div>
    );
  }

  return (
    <UnifiedQuestionnaireForm
      mode="embedded"
      clientId={clientId}
      clientName={clientName}
      userId={userId}
      sections={sections}
      questions={questions}
      initialData={existingData}
      onSave={handleSave}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      layout="sidebar"
      showHeader={false}
      autoSave={true}
      autoSaveDelay={3000}
    />
  );
}
