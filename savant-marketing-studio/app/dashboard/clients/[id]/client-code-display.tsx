'use client';

import { CopyableCode } from '@/components/copyable-code';

interface ClientCodeDisplayProps {
  code: string | null;
  className?: string;
}

export function ClientCodeDisplay({ code, className = '' }: ClientCodeDisplayProps) {
  if (!code) return null;
  
  return (
    <CopyableCode code={code} className={className} />
  );
}

