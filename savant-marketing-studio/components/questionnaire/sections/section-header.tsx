'use client';

import { Clock } from 'lucide-react';

interface SectionHeaderProps {
  sectionNumber: number;
  title: string;
  description: string;
  estimatedTime: string;
}

export default function SectionHeader({
  sectionNumber,
  title,
  description,
  estimatedTime,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 md:mb-8 pb-4 md:pb-6 border-b border-border">
      <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
          <span className="text-xl md:text-2xl font-bold">{sectionNumber}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">{title}</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-2 md:mb-3">{description}</p>
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Clock className="w-3 h-3 md:w-4 md:h-4" />
            <span>⏱️ {estimatedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
