'use client';

import { createFramework, getFrameworkCategories } from '@/app/actions/frameworks';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function NewFrameworkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    getFrameworkCategories().then(setCategories);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createFramework(formData);
      
      if ('error' in result) {
        alert(result.error);
        return;
      }

      router.push('/dashboard/frameworks');
    } catch (error) {
      console.error('Failed to create framework:', error);
      alert('Failed to create framework');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/frameworks"
          className="inline-flex items-center gap-2 text-silver hover:text-foreground text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Frameworks
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">New Framework</h1>
        <p className="text-silver text-sm mt-1">
          Add a copywriting framework to enhance AI content generation
        </p>
      </div>

      {/* Info */}
      <div className="mb-6 p-4 bg-surface border border-border rounded-lg flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-red-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">What makes a good framework?</p>
          <ul className="text-silver mt-2 space-y-1 list-disc list-inside">
            <li>Clear structure (headings, steps, sections)</li>
            <li>Examples of good copy</li>
            <li>Templates with placeholders</li>
            <li>Rules and principles to follow</li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g., AIDA Copywriting Framework"
            className="w-full p-3 border border-border rounded-lg bg-surface"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <input
            type="text"
            name="description"
            placeholder="Brief description of when to use this framework"
            className="w-full p-3 border border-border rounded-lg bg-surface"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            name="category"
            className="w-full p-3 border border-border rounded-lg bg-surface"
          >
            <option value="">Select category...</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="copywriting">copywriting</option>
            <option value="strategy">strategy</option>
            <option value="funnel">funnel</option>
            <option value="ads">ads</option>
            <option value="email">email</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content *</label>
          <textarea
            name="content"
            required
            rows={15}
            placeholder={`Paste your framework content here...

Example:
# AIDA Framework

## Attention
- Start with a bold claim or question
- Use pattern interrupts
- Example: "What if everything you knew about X was wrong?"

## Interest
- Present the problem vividly
- Show you understand their pain
- Example: ...

## Desire
- Paint the transformation
- Stack benefits
- Example: ...

## Action
- Clear CTA
- Remove friction
- Example: ...`}
            className="w-full p-3 border border-border rounded-lg bg-surface font-mono text-sm"
          />
          <p className="text-xs text-silver mt-2">
            Markdown supported. Will be chunked and embedded for AI search.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-red-primary text-white rounded-lg hover:bg-red-primary/90 disabled:opacity-50 font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Framework'
            )}
          </button>
          <Link
            href="/dashboard/frameworks"
            className="px-6 py-3 border border-border rounded-lg hover:bg-surface"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

