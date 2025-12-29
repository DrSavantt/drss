'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionConfig } from '@/lib/questionnaire/questions-config';
import type { SaveStatus } from '@/lib/questionnaire/unified-types';

interface PillsLayoutProps {
  // Navigation
  sections: SectionConfig[];
  currentSectionIndex: number;
  completedSections: Set<string>;
  onSectionClick: (index: number) => void;
  
  // Progress
  progressPercent: number;
  
  // Current section info
  currentSection: SectionConfig;
  
  // Header
  clientName: string;
  showThemeToggle?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  
  // Save status
  saveStatus?: SaveStatus;
  lastSaved?: Date | null;
  
  // Children (the questions)
  children: React.ReactNode;
  
  // Footer (prev/next buttons)
  footer?: React.ReactNode;
}

/**
 * Horizontal pills layout for public-facing questionnaire forms.
 * Optimized for single-column layouts with clear visual hierarchy.
 * 
 * Structure:
 * - Top: Header with client name and theme toggle
 * - Progress bar
 * - Horizontal pill navigation
 * - Section content card
 * - Footer with navigation buttons
 */
export function PillsLayout({
  sections,
  currentSectionIndex,
  completedSections,
  onSectionClick,
  progressPercent,
  currentSection,
  clientName,
  showThemeToggle = true,
  isDarkMode = false,
  onToggleTheme,
  saveStatus = 'idle',
  lastSaved,
  children,
  footer,
}: PillsLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Questionnaire</h1>
          <p className="text-muted-foreground">for {clientName}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Save status indicator */}
          {saveStatus === 'saving' && (
            <span className="text-sm text-muted-foreground animate-pulse">
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && lastSaved && (
            <span className="text-sm text-muted-foreground">
              Saved at {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-destructive">
              Save failed
            </span>
          )}
          
          {/* Theme toggle */}
          {showThemeToggle && onToggleTheme && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-sm text-muted-foreground text-center">
          {progressPercent}% complete
        </p>
      </div>

      {/* Section Pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {sections.map((section, index) => {
          const isComplete = completedSections.has(section.key);
          const isCurrent = index === currentSectionIndex;
          
          return (
            <button
              key={section.id}
              onClick={() => onSectionClick(index)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all",
                "border font-medium",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isCurrent 
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : isComplete
                    ? "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
                    : "bg-muted/50 text-muted-foreground border-muted hover:bg-muted hover:text-foreground"
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isComplete ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline">{section.title}</span>
            </button>
          );
        })}
      </div>

      {/* Section Content Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl">{currentSection.title}</CardTitle>
          {currentSection.description && (
            <CardDescription className="text-base">
              {currentSection.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>

      {/* Footer Navigation */}
      {footer && (
        <div className="flex justify-between items-center py-4">
          {footer}
        </div>
      )}
    </div>
  );
}

