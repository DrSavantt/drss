'use client';

import { Clock } from 'lucide-react';

interface SectionHeaderCardProps {
  sectionNumber: number;
  title: string;
  description: string;
  estimatedTime: string;
  questionsAnswered: number;
  totalQuestions: number;
}

export function SectionHeaderCard({
  sectionNumber,
  title,
  description,
  estimatedTime,
  questionsAnswered,
  totalQuestions,
}: SectionHeaderCardProps) {
  const progressPercent = totalQuestions > 0
    ? Math.round((questionsAnswered / totalQuestions) * 100)
    : 0;

  return (
    <div className="relative bg-card border border-border rounded-xl p-6 mb-8">
      {/* Time Badge - Absolute Top Right */}
      <div className="absolute top-5 right-5 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
        <Clock className="w-3.5 h-3.5" />
        <span>{estimatedTime}</span>
      </div>

      {/* Main Content Row */}
      <div className="flex items-start gap-5 pr-24">
        {/* Section Number Circle */}
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">{sectionNumber}</span>
        </div>

        {/* Title & Description */}
        <div className="flex-1 pt-1">
          <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="text-muted-foreground uppercase tracking-wide font-medium">Progress</span>
          <span className="text-muted-foreground">
            <span className="text-foreground font-semibold">{questionsAnswered}</span>
            <span className="mx-1">/</span>
            <span>{totalQuestions}</span>
            <span className="text-muted-foreground ml-2">({progressPercent}%)</span>
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
