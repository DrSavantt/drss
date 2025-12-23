import { getFrameworks } from '@/app/actions/frameworks';
import Link from 'next/link';
import { Plus, FileText, Sparkles } from 'lucide-react';

export default async function FrameworksPage() {
  const frameworks = await getFrameworks();

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Framework Library</h1>
          <p className="text-silver text-sm mt-1">
            Your copywriting frameworks power AI content generation
          </p>
        </div>
        <Link
          href="/dashboard/frameworks/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-primary text-white rounded-lg hover:bg-red-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Framework
        </Link>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-red-primary/5 border border-red-primary/20 rounded-lg flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-red-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">How frameworks work</p>
          <p className="text-silver mt-1">
            When you generate content, AI searches your frameworks for relevant patterns and examples.
            More frameworks = better, more consistent content.
          </p>
        </div>
      </div>

      {/* Framework Grid */}
      {frameworks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {frameworks.map((framework) => (
            <Link
              key={framework.id}
              href={`/dashboard/frameworks/${framework.id}`}
              className="p-5 border border-border rounded-lg hover:bg-surface hover:border-red-primary/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface rounded-lg group-hover:bg-background transition-colors">
                  <FileText className="w-5 h-5 text-red-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{framework.name}</h3>
                  {framework.description && (
                    <p className="text-silver text-sm mt-1 line-clamp-2">
                      {framework.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    {framework.category && (
                      <span className="px-2 py-0.5 bg-surface text-xs rounded">
                        {framework.category}
                      </span>
                    )}
                    <span className="text-xs text-silver">
                      {framework.content.length.toLocaleString()} chars
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <FileText className="w-12 h-12 mx-auto text-silver/30 mb-4" />
          <h3 className="font-bold text-lg mb-2">No frameworks yet</h3>
          <p className="text-silver text-sm mb-6 max-w-md mx-auto">
            Add your first copywriting framework to supercharge AI content generation.
            Examples: AIDA, PAS, Value Ladder, Email sequences, Ad formulas.
          </p>
          <Link
            href="/dashboard/frameworks/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-primary text-white rounded-lg hover:bg-red-primary/90"
          >
            <Plus className="w-5 h-5" />
            Create Your First Framework
          </Link>
        </div>
      )}
    </div>
  );
}

