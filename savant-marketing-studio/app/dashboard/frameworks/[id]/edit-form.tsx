'use client';

import { updateFramework, deleteFramework, getFrameworkCategories, Framework } from '@/app/actions/frameworks';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function FrameworkEditForm({ framework }: { framework: Framework }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    getFrameworkCategories().then(setCategories);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await updateFramework(framework.id, formData);
      
      if ('error' in result) {
        alert(result.error);
        return;
      }

      router.push('/dashboard/frameworks');
    } catch (error) {
      console.error('Failed to update framework:', error);
      alert('Failed to update framework');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this framework? This cannot be undone.')) return;

    setDeleting(true);
    try {
      const result = await deleteFramework(framework.id);
      
      if ('error' in result) {
        alert(result.error);
        return;
      }

      router.push('/dashboard/frameworks');
    } catch (error) {
      console.error('Failed to delete framework:', error);
      alert('Failed to delete framework');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/dashboard/frameworks"
            className="inline-flex items-center gap-2 text-silver hover:text-foreground text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Frameworks
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Framework</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 disabled:opacity-50 flex items-center gap-2"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Delete
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={framework.name}
            className="w-full p-3 border border-border rounded-lg bg-surface"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <input
            type="text"
            name="description"
            defaultValue={framework.description || ''}
            className="w-full p-3 border border-border rounded-lg bg-surface"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            name="category"
            defaultValue={framework.category || ''}
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
            defaultValue={framework.content}
            className="w-full p-3 border border-border rounded-lg bg-surface font-mono text-sm"
          />
          <p className="text-xs text-silver mt-2">
            Saving will regenerate embeddings for AI search.
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
                Saving...
              </span>
            ) : (
              'Save Changes'
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

