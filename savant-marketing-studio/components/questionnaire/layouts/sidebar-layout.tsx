'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, Save, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionConfig } from '@/lib/questionnaire/questions-config';

interface SidebarLayoutProps {
  // Navigation
  sections: SectionConfig[];
  currentSectionIndex: number;
  completedSections: Set<string>;
  onSectionClick: (index: number) => void;
  
  // Progress
  progressPercent: number;
  
  // Current section info
  currentSection: SectionConfig;
  
  // Actions
  onSave?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  
  // Focus mode toggle
  onToggleFocusMode?: () => void;
  
  // Children (the questions)
  children: React.ReactNode;
  
  // Footer (prev/next buttons)
  footer?: React.ReactNode;
}

/**
 * V0-style 2-column layout with sticky sidebar navigation.
 * Best for embedded/admin use where screen real estate is available.
 * 
 * Structure:
 * - Left: Sticky sidebar with section list and progress
 * - Right: Section content card with questions
 */
export function SidebarLayout({
  sections,
  currentSectionIndex,
  completedSections,
  onSectionClick,
  progressPercent,
  currentSection,
  onSave,
  isSaving,
  lastSaved,
  onToggleFocusMode,
  children,
  footer,
}: SidebarLayoutProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Left Sidebar - Section Navigation */}
      <Card className="h-fit sticky top-4 border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Sections</CardTitle>
          <div className="space-y-2 pt-2">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progressPercent}% complete
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 pb-4">
          {sections.map((section, index) => {
            const isComplete = completedSections.has(section.key);
            const isCurrent = index === currentSectionIndex;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionClick(index)}
                className={cn(
                  "flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors",
                  "hover:bg-muted/50",
                  isCurrent && "bg-primary/10 text-primary",
                  !isCurrent && "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0",
                  "border transition-colors",
                  isComplete 
                    ? "bg-green-500 text-white border-green-500" 
                    : isCurrent 
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-muted-foreground/30"
                )}>
                  {isComplete ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span className={cn(
                  "text-sm truncate",
                  isCurrent && "font-medium"
                )}>
                  {section.title}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Right Side - Questions */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              Section {currentSectionIndex + 1}: {currentSection.title}
            </CardTitle>
            {currentSection.description && (
              <CardDescription className="text-base">
                {currentSection.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onToggleFocusMode && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleFocusMode}
                title="Focus Mode - One question at a time"
                aria-label="Toggle focus mode"
              >
                <Focus className="w-5 h-5" />
              </Button>
            )}
            {onSave && (
              <div className="flex flex-col items-end gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                {lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    Last saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question content */}
          {children}
          
          {/* Footer with navigation */}
          {footer && (
            <div className="pt-6 border-t border-border">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

