'use client';

import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyableCodeProps {
  code: string;
  className?: string;
  showIcon?: boolean;
}

export function CopyableCode({ code, className = '', showIcon = true }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-charcoal border border-mid-gray text-foreground px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-200';
      toast.innerHTML = `<span class="flex items-center gap-2"><svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Copied ${code}</span>`;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2');
        setTimeout(() => toast.remove(), 150);
      }, 2000);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 text-xs font-mono text-slate hover:text-silver transition-colors cursor-pointer group ${className}`}
      title={`Click to copy ${code}`}
    >
      <span>{code}</span>
      {showIcon && (
        <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {copied ? (
            <Check size={12} className="text-success" />
          ) : (
            <Copy size={12} />
          )}
        </span>
      )}
    </button>
  );
}

