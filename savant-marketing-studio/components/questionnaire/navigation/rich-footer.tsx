'use client';

import { ChevronLeft, ChevronRight, Check, Loader2, Circle } from 'lucide-react';

interface RichFooterProps {
  currentSection: number;
  onPrevious: () => void;
  onNext: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  isLastSection?: boolean;
}

const SECTION_NAMES = [
  'Avatar Definition',
  'Dream Outcome',
  'Problems & Obstacles',
  'Solution & Methodology',
  'Brand Voice',
  'Proof & Transformation',
  'Faith Integration',
  'Business Metrics',
] as const;

export function RichFooter({
  currentSection,
  onPrevious,
  onNext,
  saveStatus,
  isLastSection = false,
}: RichFooterProps) {
  const isFirstSection = currentSection === 1;
  const previousName = currentSection > 1 ? SECTION_NAMES[currentSection - 2] : null;
  const nextName = currentSection < 8 ? SECTION_NAMES[currentSection] : null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      
      {/* Footer content */}
      <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-[#333333]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            
            {/* LEFT: Previous Button */}
            <div className="flex flex-col items-start">
              <button
                type="button"
                onClick={onPrevious}
                disabled={isFirstSection}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg
                  border border-[#333333] 
                  transition-all duration-200
                  ${isFirstSection
                    ? 'opacity-40 cursor-not-allowed text-gray-500'
                    : 'text-gray-300 hover:bg-white/5 hover:border-[#444444] hover:text-white'
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="font-medium">Previous</span>
              </button>
              {previousName && !isFirstSection && (
                <span className="text-xs text-gray-500 mt-1.5 pl-1 truncate max-w-[140px]">
                  {previousName}
                </span>
              )}
            </div>

            {/* CENTER: Step Counter + Save Status */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm text-white font-medium">
                Step <span className="text-red-500">{currentSection}</span> of 8
              </span>
              
              <div className="flex items-center gap-1.5 mt-1.5">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                    <span className="text-xs text-gray-400">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">Auto-saved</span>
                  </>
                )}
                {saveStatus === 'idle' && (
                  <>
                    <Circle className="w-2 h-2 text-gray-500 fill-gray-500" />
                    <span className="text-xs text-gray-500">Draft</span>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: Next Button */}
            <div className="flex flex-col items-end">
              <button
                type="button"
                onClick={onNext}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-lg
                  font-medium transition-all duration-200
                  ${isLastSection
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                    : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                  }
                `}
              >
                <span>{isLastSection ? 'Review' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              {nextName && !isLastSection && (
                <span className="text-xs text-gray-500 mt-1.5 pr-1 truncate max-w-[140px]">
                  {nextName}
                </span>
              )}
              {isLastSection && (
                <span className="text-xs text-gray-500 mt-1.5 pr-1">
                  Review Answers
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
