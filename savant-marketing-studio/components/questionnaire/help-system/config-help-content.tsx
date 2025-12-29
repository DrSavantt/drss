'use client';

import { QuestionnaireConfigLike } from '@/lib/questionnaire/questionnaire-config-context';

interface ConfigHelpContentProps {
  questionId: string;
  config: QuestionnaireConfigLike; // Required: use database config
}

export function ConfigHelpContent({ questionId, config }: ConfigHelpContentProps) {
  // Try to find by ID first, then by key
  let question = config.getQuestionById(questionId);
  if (!question) {
    question = config.getQuestionByKey(questionId);
  }
  
  if (!question) {
    return (
      <div className="text-center py-8">
        <p className="text-silver">Help content not available for this question yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">
          {question.helpTitle || question.text}
        </h3>
      </div>

      {question.helpWhereToFind && question.helpWhereToFind.length > 0 && (
        <div className="bg-surface p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-2">📍 WHERE TO FIND THIS</h4>
          <ul className="space-y-2">
            {question.helpWhereToFind.map((item, index) => (
              <li key={index} className="text-foreground text-sm flex items-start gap-2">
                <span className="text-silver mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {question.helpHowToExtract && question.helpHowToExtract.length > 0 && (
        <div className="bg-surface p-4 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-2">🔍 HOW TO EXTRACT IT</h4>
          <ul className="space-y-2">
            {question.helpHowToExtract.map((item, index) => (
              <li key={index} className="text-foreground text-sm flex items-start gap-2">
                <span className="text-silver mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {question.helpGoodExample && (
        <div className="bg-green-500/10 border-l-4 border-green-500 p-3 rounded-md">
          <h4 className="font-semibold text-green-600 mb-2">✅ GOOD ANSWER</h4>
          <p className="text-foreground text-sm italic">&quot;{question.helpGoodExample}&quot;</p>
        </div>
      )}

      {question.helpWeakExample && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-md">
          <h4 className="font-semibold text-red-600 mb-2">❌ WEAK ANSWER</h4>
          <p className="text-foreground text-sm italic">&quot;{question.helpWeakExample}&quot;</p>
        </div>
      )}

      {question.helpQuickTip && (
        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 rounded-md">
          <h4 className="font-semibold text-yellow-600 mb-2">💡 QUICK TIP</h4>
          <p className="text-foreground text-sm">{question.helpQuickTip}</p>
        </div>
      )}
    </div>
  );
}

export default ConfigHelpContent;

