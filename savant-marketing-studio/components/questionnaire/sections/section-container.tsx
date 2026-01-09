'use client';

import SectionHeader from './section-header';

interface SectionContainerProps {
  sectionNumber: number;
  title: string;
  description: string;
  estimatedTime: string;
  currentProgress: { answered: number; total: number };
  children: React.ReactNode;
}

export default function SectionContainer({
  sectionNumber,
  title,
  description,
  estimatedTime,
  currentProgress,
  children,
}: SectionContainerProps) {
  const progressPercentage = (currentProgress.answered / currentProgress.total) * 100;

  return (
    <section
      id={`section-${sectionNumber}`}
      className="scroll-mt-20 mb-8 md:mb-16"
    >
      <SectionHeader
        sectionNumber={sectionNumber}
        title={title}
        description={description}
        estimatedTime={estimatedTime}
      />

      <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs md:text-sm font-medium text-foreground">
            Questions: {currentProgress.answered}/{currentProgress.total}
          </span>
          <span className="text-xs md:text-sm text-muted-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-6 md:space-y-8">
        {children}
      </div>
    </section>
  );
}
