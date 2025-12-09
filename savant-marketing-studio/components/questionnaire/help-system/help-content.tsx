'use client';

import { helpGuide } from '@/lib/questionnaire/help-guide-data';

interface HelpContentProps {
  questionNumber: number;
}

export default function HelpContent({ questionNumber }: HelpContentProps) {
  const questionKey = `q${questionNumber}`;
  const help = helpGuide[questionKey];

  if (!help) {
    return (
      <div className="text-center py-8">
        <p className="text-silver">Help content not available for this question yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">{help.title}</h3>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-border">
        <h4 className="font-semibold text-foreground mb-2">📍 WHERE TO FIND THIS</h4>
        <ul className="space-y-2">
          {help.whereToFind.map((item, index) => (
            <li key={index} className="text-foreground text-sm flex items-start gap-2">
              <span className="text-silver mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-border">
        <h4 className="font-semibold text-foreground mb-2">🔍 HOW TO EXTRACT IT</h4>
        <ul className="space-y-2">
          {help.howToExtract.map((item, index) => (
            <li key={index} className="text-foreground text-sm flex items-start gap-2">
              <span className="text-silver mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-green-500/10 border-l-4 border-green-500 p-3 rounded-md">
        <h4 className="font-semibold text-green-600 mb-2">✅ GOOD ANSWER</h4>
        <p className="text-foreground text-sm italic">&quot;{help.goodExample}&quot;</p>
      </div>

      <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-md">
        <h4 className="font-semibold text-red-600 mb-2">❌ WEAK ANSWER</h4>
        <p className="text-foreground text-sm italic">&quot;{help.weakExample}&quot;</p>
      </div>

      <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 rounded-md">
        <h4 className="font-semibold text-yellow-600 mb-2">💡 QUICK TIP</h4>
        <p className="text-foreground text-sm">{help.quickTip}</p>
      </div>
    </div>
  );
}
