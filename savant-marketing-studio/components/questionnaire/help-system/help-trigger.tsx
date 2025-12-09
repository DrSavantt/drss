'use client';

import { HelpCircle } from 'lucide-react';

interface HelpTriggerProps {
  onClick: () => void;
  questionNumber?: number;
}

export default function HelpTrigger({ onClick, questionNumber }: HelpTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-full flex items-center justify-center bg-surface border border-border hover:bg-surface-highlight hover:scale-110 transition-all"
      aria-label={`Help for question ${questionNumber || ''}`}
    >
      <HelpCircle className="w-5 h-5 text-silver" />
    </button>
  );
}
