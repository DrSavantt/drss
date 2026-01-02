// ============================================
// QUESTIONNAIRE COMPONENT EXPORTS
// ============================================
// NOTE: Using explicit exports (no `export * from`) to improve tree-shaking
// and reduce bundle size. Only commonly used components are exported.

// Main unified form component
export { UnifiedQuestionnaireForm } from './unified-questionnaire-form';

// Public form wrapper (for /form/[token] route)
export { PublicFormWrapper } from './public-form-wrapper';

// Layout components
export { SidebarLayout, PillsLayout } from './layouts';

// Navigation components
export { FormFooter } from './navigation/form-footer';
export { default as ProgressIndicator } from './navigation/progress-indicator';
export { default as SectionNav } from './navigation/section-nav';
export { default as StepFooter } from './navigation/step-footer';

// Question rendering
export { QuestionRenderer } from './question-renderer';
export { default as SectionRenderer } from './section-renderer';

// Question types - explicit exports (no barrel re-export)
export { default as QuestionWrapper } from './question-types/question-wrapper';
export { default as ShortTextQuestion } from './question-types/short-text-question';
export { default as LongTextQuestion } from './question-types/long-text-question';
export { default as MultipleChoiceQuestion } from './question-types/multiple-choice-question';

// Help system - explicit exports
export { default as HelpPanel } from './help-system/help-panel';
export { default as HelpTrigger } from './help-system/help-trigger';
export { ConfigHelpContent } from './help-system/config-help-content';

// Sections - explicit exports
export { default as SectionHeader } from './sections/section-header';
export { default as SectionContainer } from './sections/section-container';

// Review components - explicit exports
export { default as QuestionnaireReview } from './review/questionnaire-review';
export { default as ReviewSectionCard } from './review/review-section-card';

// Response viewing
export { ResponseViewer } from './response-viewer';
export { ResponseHistory, type ResponseVersion } from './response-history';
