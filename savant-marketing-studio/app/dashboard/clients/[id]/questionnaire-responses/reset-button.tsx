'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { resetQuestionnaire } from '@/app/actions/questionnaire';

interface ResetButtonProps {
  clientId: string;
}

export function ResetButton({ clientId }: ResetButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    setLoading(true);
    try {
      const result = await resetQuestionnaire(clientId);

      if (result.success) {
        // Clear localStorage
        localStorage.removeItem(`questionnaire_draft_${clientId}`);
        localStorage.removeItem(`questionnaire_completed_${clientId}`);
        localStorage.removeItem(`questionnaire_section_${clientId}`);

        // Redirect to blank questionnaire
        router.push(`/dashboard/clients/onboarding/${clientId}`);
      } else {
        alert(result.error || 'Failed to reset questionnaire');
        setLoading(false);
        setOpen(false);
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('An unexpected error occurred');
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button className="inline-flex items-center px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors font-medium">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Responses
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-[#1a1a1a] border-[#333333]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Reset Questionnaire?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            This will delete all responses and reset the questionnaire to blank. 
            You&apos;ll need to fill it out again from scratch. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="bg-surface text-foreground border-mid-gray hover:bg-surface-highlight">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? 'Resetting...' : 'Reset Everything'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

