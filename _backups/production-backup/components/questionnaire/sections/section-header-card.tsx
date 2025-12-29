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
    <div className="relative bg-[#1a1a1a] border border-[#333333] rounded-xl p-6 mb-8">
      {/* Time Badge - Absolute Top Right */}
      <div className="absolute top-5 right-5 flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full">
        <Clock className="w-3.5 h-3.5" />
        <span>{estimatedTime}</span>
      </div>

      {/* Main Content Row */}
      <div className="flex items-start gap-5 pr-24">
        {/* Section Number Circle */}
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
          <span className="text-2xl font-bold text-red-500">{sectionNumber}</span>
        </div>

        {/* Title & Description */}
        <div className="flex-1 pt-1">
          <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-6 pt-5 border-t border-[#333333]/70">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="text-gray-500 uppercase tracking-wide font-medium">Progress</span>
          <span className="text-gray-400">
            <span className="text-white font-semibold">{questionsAnswered}</span>
            <span className="mx-1">/</span>
            <span>{totalQuestions}</span>
            <span className="text-gray-500 ml-2">({progressPercent}%)</span>
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-[#333333] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
