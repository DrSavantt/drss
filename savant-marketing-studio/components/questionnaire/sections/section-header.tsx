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
    <div className="mb-8 pb-6 border-b border-border">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-red-primary text-white flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold">{sectionNumber}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
          <p className="text-base text-silver mb-3">{description}</p>
          <div className="flex items-center gap-2 text-sm text-silver">
            <Clock className="w-4 h-4" />
            <span>⏱️ {estimatedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
