import Link from 'next/link';
import { ArrowLeft, FileX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <FileX className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Framework Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The framework you're looking for doesn't exist or has been deleted.
      </p>
      <Link
        href="/dashboard/frameworks"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Frameworks
      </Link>
    </div>
  );
}

