'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function HelpPanel({ isOpen, onClose, children }: HelpPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] sm:max-w-[400px] p-0 flex flex-col"
      >
        <SheetHeader className="p-6 border-b border-border shrink-0">
          <SheetTitle className="text-xl font-bold">Help Guide</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
