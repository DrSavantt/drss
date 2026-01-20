// ============================================
// UNIFIED QUESTIONNAIRE FORM TYPES
// Single form that works in 3 contexts: embedded, public, preview
// ============================================

import type { SectionConfig, QuestionConfig } from './questions-config';
import type { QuestionnaireData } from './types';

// ===== CORE TYPES =====

/**
 * The context in which the questionnaire is being used:
 * - embedded: Within the admin dashboard (authenticated user)
 * - public: Client-facing public link (token-based auth)
 * - preview: Read-only preview mode (no saving)
 */
export type FormMode = 'embedded' | 'public' | 'preview';

/**
 * Layout style for the questionnaire form:
 * - sidebar: V0-style 2-column layout with sticky sidebar navigation
 * - pills: Horizontal pill tabs at the top (better for public forms)
 * - stepper: Linear step-by-step wizard (future enhancement)
 * - focus: One question at a time (Typeform style)
 */
export type LayoutType = 'sidebar' | 'pills' | 'stepper' | 'focus';

/**
 * Auto-save status indicator
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ===== MAIN COMPONENT PROPS =====

export interface UnifiedQuestionnaireFormProps {
  // ===== REQUIRED =====
  
  /** The context in which the form is being used */
  mode: FormMode;
  
  /** Client ID for data persistence */
  clientId: string;
  
  /** Client name for display purposes */
  clientName: string;
  
  // ===== AUTHENTICATION (one required based on mode) =====
  
  /** Public access token (required for mode === 'public') */
  token?: string | null;
  
  /** Authenticated user ID (required for mode === 'embedded') */
  userId?: string;
  
  // ===== DATA =====
  
  /** Section configuration from database */
  sections: SectionConfig[];
  
  /** Question configuration from database */
  questions: QuestionConfig[];
  
  /** Pre-existing questionnaire data (for editing/resuming) */
  initialData?: QuestionnaireData | null;
  
  // ===== CALLBACKS =====
  
  /** Called when form data is saved (auto-save or manual) */
  onSave?: (data: QuestionnaireData) => Promise<void>;
  
  /** Called when form is submitted (final submission) */
  onSubmit?: (data: QuestionnaireData) => Promise<void>;
  
  /** Called when form is cancelled/closed */
  onCancel?: () => void;
  
  // ===== UI OPTIONS =====
  
  /** Show header with client name (default: true) */
  showHeader?: boolean;
  
  /** Show progress indicator (default: true) */
  showProgress?: boolean;
  
  /** Show theme toggle button (default: mode === 'public') */
  showThemeToggle?: boolean;
  
  /** Show manual save button (default: true) */
  showSaveButton?: boolean;
  
  // ===== BEHAVIOR =====
  
  /** Enable auto-save functionality (default: true) */
  autoSave?: boolean;
  
  /** Delay in ms before auto-saving (default: 3000) */
  autoSaveDelay?: number;
  
  // ===== EXTERNAL THEME CONTROL (for independent public form theme) =====
  
  /** External dark mode state (when provided, component uses this instead of internal state) */
  isDarkMode?: boolean;
  
  /** External theme toggle handler (when provided, component calls this instead of internal toggle) */
  onToggleTheme?: () => void;
  
  // ===== LAYOUT =====
  
  /** 
   * Layout style to use
   * Default: mode === 'embedded' ? 'sidebar' : 'pills'
   */
  layout?: LayoutType;
}

// ===== LAYOUT COMPONENT PROPS =====

export interface BaseLayoutProps {
  /** Section configurations */
  sections: SectionConfig[];
  
  /** Current section index (0-based) */
  currentSectionIndex: number;
  
  /** Set of completed section IDs */
  completedSections: Set<string>;
  
  /** Handler for section navigation clicks */
  onSectionClick: (index: number) => void;
  
  /** Progress percentage (0-100) */
  progressPercent: number;
  
  /** Current section configuration */
  currentSection: SectionConfig;
  
  /** Question content to render */
  children: React.ReactNode;
  
  /** Footer with navigation buttons */
  footer?: React.ReactNode;
}

export interface SidebarLayoutProps extends BaseLayoutProps {
  /** Save handler (optional - shows save button if provided) */
  onSave?: () => void;
  
  /** Whether save is in progress */
  isSaving?: boolean;
  
  /** Last saved timestamp */
  lastSaved?: Date | null;
}

export interface PillsLayoutProps extends BaseLayoutProps {
  /** Client name for header display */
  clientName: string;
  
  /** Show theme toggle button */
  showThemeToggle?: boolean;
  
  /** Current dark mode state */
  isDarkMode?: boolean;
  
  /** Theme toggle handler */
  onToggleTheme?: () => void;
  
  /** Current save status */
  saveStatus?: SaveStatus;
  
  /** Last saved timestamp */
  lastSaved?: Date | null;
}

// ===== NAVIGATION PROPS =====

export interface FormFooterProps {
  /** Current section index (0-based) */
  currentSectionIndex: number;
  
  /** Total number of sections */
  totalSections: number;
  
  /** Go to previous section */
  onPrevious: () => void;
  
  /** Go to next section */
  onNext: () => void;
  
  /** Submit the form */
  onSubmit: () => void;
  
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  
  /** Whether form is valid for submission */
  canSubmit?: boolean;
}

// ===== HELPER FUNCTIONS =====

/**
 * Get default layout based on form mode
 */
export function getDefaultLayout(mode: FormMode): LayoutType {
  switch (mode) {
    case 'embedded':
      return 'sidebar';
    case 'public':
    case 'preview':
      return 'pills';
    default:
      return 'pills';
  }
}

/**
 * Get default UI options based on form mode
 */
export function getDefaultUIOptions(mode: FormMode) {
  return {
    showHeader: true,
    showProgress: true,
    showThemeToggle: mode === 'public',
    showSaveButton: mode !== 'preview',
    autoSave: mode !== 'preview',
    autoSaveDelay: 3000,
  };
}

