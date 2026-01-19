'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIEditPreviewProps {
  originalContent: string;
  suggestedContent: string;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

// Simple diff algorithm - finds changes between original and suggested
function computeDiff(original: string, suggested: string): Array<{
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}> {
  // Strip HTML for comparison (simple approach)
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');
  
  const originalText = stripHtml(original);
  const suggestedText = stripHtml(suggested);
  
  // If texts are identical, return unchanged
  if (originalText === suggestedText) {
    return [{ type: 'unchanged', text: suggestedText }];
  }
  
  // Simple word-level diff
  const originalWords = originalText.split(/(\s+)/);
  const suggestedWords = suggestedText.split(/(\s+)/);
  
  const diff: Array<{ type: 'unchanged' | 'added' | 'removed'; text: string }> = [];
  
  let i = 0, j = 0;
  
  while (i < originalWords.length || j < suggestedWords.length) {
    if (i >= originalWords.length) {
      // Remaining suggested words are additions
      diff.push({ type: 'added', text: suggestedWords.slice(j).join('') });
      break;
    }
    if (j >= suggestedWords.length) {
      // Remaining original words are deletions
      diff.push({ type: 'removed', text: originalWords.slice(i).join('') });
      break;
    }
    
    if (originalWords[i] === suggestedWords[j]) {
      // Words match
      diff.push({ type: 'unchanged', text: originalWords[i] });
      i++;
      j++;
    } else {
      // Words differ - check if it's a replacement, addition, or deletion
      const originalInSuggested = suggestedWords.indexOf(originalWords[i], j);
      const suggestedInOriginal = originalWords.indexOf(suggestedWords[j], i);
      
      if (originalInSuggested === -1 && suggestedInOriginal === -1) {
        // Simple replacement
        diff.push({ type: 'removed', text: originalWords[i] });
        diff.push({ type: 'added', text: suggestedWords[j] });
        i++;
        j++;
      } else if (originalInSuggested !== -1 && (suggestedInOriginal === -1 || originalInSuggested - j < suggestedInOriginal - i)) {
        // Addition in suggested
        diff.push({ type: 'added', text: suggestedWords[j] });
        j++;
      } else {
        // Deletion from original
        diff.push({ type: 'removed', text: originalWords[i] });
        i++;
      }
    }
  }
  
  // Merge consecutive same-type entries
  const merged: typeof diff = [];
  for (const entry of diff) {
    if (merged.length > 0 && merged[merged.length - 1].type === entry.type) {
      merged[merged.length - 1].text += entry.text;
    } else {
      merged.push(entry);
    }
  }
  
  return merged;
}

export function AIEditPreview({
  originalContent,
  suggestedContent,
  onAccept,
  onReject,
  isLoading
}: AIEditPreviewProps) {
  const diff = useMemo(
    () => computeDiff(originalContent, suggestedContent),
    [originalContent, suggestedContent]
  );
  
  const hasChanges = diff.some(d => d.type !== 'unchanged');
  const additions = diff.filter(d => d.type === 'added').length;
  const deletions = diff.filter(d => d.type === 'removed').length;
  
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card mb-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-sm font-medium">AI Suggestion</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onReject}
            disabled={isLoading}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            disabled={isLoading || !hasChanges}
            className="h-8"
          >
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
        </div>
      </div>
      
      {/* Diff Content */}
      <div className="p-4 max-h-[300px] overflow-y-auto">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {diff.map((part, index) => (
            <span
              key={index}
              className={cn(
                part.type === 'added' && 'bg-green-500/20 text-green-700 dark:text-green-400',
                part.type === 'removed' && 'bg-red-500/20 text-red-700 dark:text-red-400 line-through'
              )}
            >
              {part.text}
            </span>
          ))}
        </div>
      </div>
      
      {/* Footer with stats */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
        {hasChanges ? (
          <span>
            {additions} addition{additions !== 1 ? 's' : ''}, {deletions} deletion{deletions !== 1 ? 's' : ''}
          </span>
        ) : (
          <span>No changes detected</span>
        )}
      </div>
    </div>
  );
}
