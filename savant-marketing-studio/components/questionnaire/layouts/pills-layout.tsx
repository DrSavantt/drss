'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Focus } from 'lucide-react';
import type { SectionConfig } from '@/lib/questionnaire/questions-config';
import type { SaveStatus } from '@/lib/questionnaire/unified-types';
import { SectionNav } from '../navigation/section-nav';

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
  
  // Focus mode toggle
  onToggleFocusMode?: () => void;
  
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
 * - Section navigation with step circles and progress bar
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
  onToggleFocusMode,
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
          
          {/* Focus mode toggle */}
          {onToggleFocusMode && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleFocusMode}
              title="Focus Mode - One question at a time"
              aria-label="Toggle focus mode"
            >
              <Focus className="h-5 w-5" />
            </Button>
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

      {/* Section Navigation with Step Circles and Progress */}
      <SectionNav
        sections={sections}
        currentSectionIndex={currentSectionIndex}
        completedSections={completedSections}
        onSectionClick={onSectionClick}
        progressPercent={progressPercent}
      />

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
