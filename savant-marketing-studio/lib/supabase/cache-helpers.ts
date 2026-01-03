/**
 * Cache Helpers
 * 
 * Functions to invalidate cached queries when data changes.
 * Use these in server actions after mutations.
 */

import { revalidateTag } from 'next/cache'

// ============================================================================
// INDIVIDUAL TAG REVALIDATION
// ============================================================================

/** Revalidate all client-related caches */
export function revalidateClients() {
  revalidateTag('clients')
}

/** Revalidate all project-related caches */
export function revalidateProjects() {
  revalidateTag('projects')
}

/** Revalidate all content-related caches */
export function revalidateContent() {
  revalidateTag('content')
}

/** Revalidate questionnaire config cache */
export function revalidateQuestionnaireConfig() {
  revalidateTag('questionnaire-config')
}

/** Revalidate questionnaire responses cache */
export function revalidateQuestionnaire() {
  revalidateTag('questionnaire')
}

/** Revalidate activity log cache */
export function revalidateActivity() {
  revalidateTag('activity')
}

/** Revalidate AI history cache */
export function revalidateAIHistory() {
  revalidateTag('ai-history')
}

/** Revalidate dashboard stats cache */
export function revalidateDashboard() {
  revalidateTag('dashboard')
}

/** Revalidate analytics data cache */
export function revalidateAnalytics() {
  revalidateTag('analytics')
}

// ============================================================================
// GROUPED REVALIDATION (for related caches)
// ============================================================================

/** Revalidate everything when a client is created/updated/deleted */
export function revalidateClientAndRelated() {
  revalidateTag('clients')
  revalidateTag('dashboard')
  revalidateTag('analytics')
}

/** Revalidate everything when a project is created/updated/deleted */
export function revalidateProjectAndRelated() {
  revalidateTag('projects')
  revalidateTag('clients')  // Client project counts change
  revalidateTag('dashboard')
  revalidateTag('analytics')
}

/** Revalidate everything when content is created/updated/deleted */
export function revalidateContentAndRelated() {
  revalidateTag('content')
  revalidateTag('clients')  // Client content counts change
  revalidateTag('dashboard')
  revalidateTag('analytics')
}

/** Revalidate everything when a questionnaire response is submitted */
export function revalidateQuestionnaireAndRelated() {
  revalidateTag('questionnaire')
  revalidateTag('clients')  // Client status may change
  revalidateTag('activity')
}

/** Revalidate everything when AI generation completes */
export function revalidateAIAndRelated() {
  revalidateTag('ai-history')
  revalidateTag('content')  // New content may be generated
  revalidateTag('analytics')
}

// ============================================================================
// FULL CACHE BUST (use sparingly)
// ============================================================================

/** Revalidate ALL caches - use only when absolutely necessary */
export function revalidateAll() {
  revalidateTag('clients')
  revalidateTag('projects')
  revalidateTag('content')
  revalidateTag('questionnaire')
  revalidateTag('questionnaire-config')
  revalidateTag('activity')
  revalidateTag('ai-history')
  revalidateTag('dashboard')
  revalidateTag('analytics')
}

