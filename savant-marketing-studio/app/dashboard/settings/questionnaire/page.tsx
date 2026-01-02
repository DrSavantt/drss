'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================
// QUESTIONNAIRE SETTINGS PAGE - DYNAMIC IMPORT
// dnd-kit (~30kb) only loads when this page is visited
// ============================================

const QuestionnaireSettings = dynamic(
  () => import('@/components/settings/questionnaire-settings').then(mod => ({ default: mod.QuestionnaireSettings })),
  {
    loading: () => (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        
        {/* Sections List */}
        <div className="rounded-lg border border-border bg-card">
          <div className="p-6 border-b border-border">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="p-6 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-border">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-5" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
)

// Note: metadata removed - not allowed in client components
// Title is set via the h1 in the component instead

export default function QuestionnaireSettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Questionnaire Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize questions, sections, validation rules, and help content
        </p>
      </div>
      
      <QuestionnaireSettings />
    </div>
  )
}
