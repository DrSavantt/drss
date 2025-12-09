'use client';

import { Check, Clock } from 'lucide-react';

interface Section {
  number: number;
  title: string;
  questions: number;
  time: string;
}

interface SectionNavProps {
  sections: Section[];
  currentSection: number;
  completedSections: number[];
  onSectionClick: (sectionNumber: number) => void;
}

export default function SectionNav({
  sections,
  currentSection,
  completedSections,
  onSectionClick,
}: SectionNavProps) {
  return (
    <div className="w-[280px] sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto bg-surface border-r border-border">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-silver uppercase tracking-wide mb-4">
          Sections
        </h2>
        <nav className="space-y-2">
          {sections.map((section) => {
            const isCompleted = completedSections.includes(section.number);
            const isCurrent = section.number === currentSection;

            return (
              <button
                key={section.number}
                onClick={() => onSectionClick(section.number)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-surface-highlight text-red-primary border-l-4 border-red-primary'
                    : 'hover:bg-surface-highlight/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-semibold ${
                          isCurrent ? 'text-red-primary' : 'text-foreground'
                        }`}
                      >
                        {section.number}. {section.title}
                      </span>
                      {isCompleted && (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-silver">
                      <span>{section.questions} questions</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {section.time}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
