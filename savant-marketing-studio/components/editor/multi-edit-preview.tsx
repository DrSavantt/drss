'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, ChevronDown, ChevronUp, CheckCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditResult } from './ai-prompt-bar';

interface MultiEditPreviewProps {
  edits: EditResult[];
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onAcceptOne: (id: string) => void;
  onRejectOne: (id: string) => void;
  isLoading?: boolean;
}

// Simple diff algorithm for showing changes
function computeSimpleDiff(original: string, edited: string): Array<{
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}> {
  // If texts are identical, return unchanged
  if (original === edited) {
    return [{ type: 'unchanged', text: edited }];
  }
  
  // Simple word-level diff
  const originalWords = original.split(/(\s+)/);
  const editedWords = edited.split(/(\s+)/);
  
  const diff: Array<{ type: 'unchanged' | 'added' | 'removed'; text: string }> = [];
  
  let i = 0, j = 0;
  
  while (i < originalWords.length || j < editedWords.length) {
    if (i >= originalWords.length) {
      diff.push({ type: 'added', text: editedWords.slice(j).join('') });
      break;
    }
    if (j >= editedWords.length) {
      diff.push({ type: 'removed', text: originalWords.slice(i).join('') });
      break;
    }
    
    if (originalWords[i] === editedWords[j]) {
      diff.push({ type: 'unchanged', text: originalWords[i] });
      i++;
      j++;
    } else {
      const originalInEdited = editedWords.indexOf(originalWords[i], j);
      const editedInOriginal = originalWords.indexOf(editedWords[j], i);
      
      if (originalInEdited === -1 && editedInOriginal === -1) {
        diff.push({ type: 'removed', text: originalWords[i] });
        diff.push({ type: 'added', text: editedWords[j] });
        i++;
        j++;
      } else if (originalInEdited !== -1 && (editedInOriginal === -1 || originalInEdited - j < editedInOriginal - i)) {
        diff.push({ type: 'added', text: editedWords[j] });
        j++;
      } else {
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

// Single edit preview item
function EditPreviewItem({
  edit,
  index,
  isExpanded,
  onToggle,
  onAccept,
  onReject,
  isLoading
}: {
  edit: EditResult;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}) {
  const diff = useMemo(
    () => computeSimpleDiff(edit.original, edit.edited),
    [edit.original, edit.edited]
  );
  
  const hasChanges = diff.some(d => d.type !== 'unchanged');
  const additions = diff.filter(d => d.type === 'added').length;
  const deletions = diff.filter(d => d.type === 'removed').length;
  
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header - Collapsible */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {/* Index badge */}
          <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-xs font-medium">
            {index + 1}
          </span>
          
          <span className="text-sm font-medium">Selection {index + 1}</span>
          
          {/* Stats */}
          <span className="text-xs text-muted-foreground">
            {hasChanges ? (
              <>
                <span className="text-green-600 dark:text-green-400">+{additions}</span>
                {' / '}
                <span className="text-red-600 dark:text-red-400">-{deletions}</span>
              </>
            ) : (
              'No changes'
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Accept/Reject for this item */}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            disabled={isLoading}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            disabled={isLoading || !hasChanges}
            className="h-7 px-2"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          
          {/* Expand/Collapse */}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Diff Content - Collapsible */}
      {isExpanded && (
        <div className="p-3 max-h-[150px] overflow-y-auto">
          <div className="text-sm leading-relaxed">
            {diff.map((part, idx) => (
              <span
                key={idx}
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
      )}
    </div>
  );
}

export function MultiEditPreview({
  edits,
  onAcceptAll,
  onRejectAll,
  onAcceptOne,
  onRejectOne,
  isLoading
}: MultiEditPreviewProps) {
  // Track which edits are expanded (default: first one expanded)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(edits.length > 0 ? [edits[0].id] : []);
  });
  
  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const expandAll = () => {
    setExpandedIds(new Set(edits.map(e => e.id)));
  };
  
  const collapseAll = () => {
    setExpandedIds(new Set());
  };
  
  const allExpanded = edits.every(e => expandedIds.has(e.id));
  
  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-card/50">
      {/* Header with global actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            AI Suggestions ({edits.length})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={allExpanded ? collapseAll : expandAll}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRejectAll}
            disabled={isLoading}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject All
          </Button>
          <Button
            size="sm"
            onClick={onAcceptAll}
            disabled={isLoading}
            className="h-8"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Accept All
          </Button>
        </div>
      </div>
      
      {/* Edit items */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {edits.map((edit, index) => (
          <EditPreviewItem
            key={edit.id}
            edit={edit}
            index={index}
            isExpanded={expandedIds.has(edit.id)}
            onToggle={() => toggleExpanded(edit.id)}
            onAccept={() => onAcceptOne(edit.id)}
            onReject={() => onRejectOne(edit.id)}
            isLoading={isLoading}
          />
        ))}
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center">
        Review each edit and accept or reject individually, or use the buttons above to apply to all.
      </p>
    </div>
  );
}
