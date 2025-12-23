'use client';

import { generateContent, saveGeneratedContent, getClientsForDropdown, GenerateContentResult } from '@/app/actions/ai';
import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Save, Check, Copy, RefreshCw, X } from 'lucide-react';

const STORAGE_KEY = 'ai_studio_state';
const RESULT_KEY = 'ai_studio_result';

interface FormState {
  clientId: string;
  contentType: string;
  complexity: string;
  model: string;
  prompt: string;
  autoSave: boolean;
}

interface Client {
  id: string;
  name: string;
}

export default function AIGeneratePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<GenerateContentResult | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Form state with localStorage persistence
  const [formState, setFormState] = useState<FormState>({
    clientId: '',
    contentType: 'email',
    complexity: 'medium',
    model: '',
    prompt: '',
    autoSave: true,
  });

  // Load clients on mount
  useEffect(() => {
    async function loadClients() {
      try {
        const clientList = await getClientsForDropdown();
        setClients(clientList);
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, []);

  // Restore state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Restore form state
      const savedForm = localStorage.getItem(STORAGE_KEY);
      if (savedForm) {
        const parsed = JSON.parse(savedForm);
        setFormState(prev => ({ ...prev, ...parsed }));
      }
      
      // Restore generated result
      const savedResult = localStorage.getItem(RESULT_KEY);
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        setResult(parsed);
      }
    } catch (error) {
      console.error('Failed to restore state:', error);
    }
  }, []);

  // Save state to localStorage when it changes (debounced)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
      } catch (error) {
        console.error('Failed to save state:', error);
      }
    }, 300); // Debounce to avoid excessive writes

    return () => clearTimeout(timeoutId);
  }, [formState]);

  // Save result to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (result) {
      try {
        localStorage.setItem(RESULT_KEY, JSON.stringify(result));
      } catch (error) {
        console.error('Failed to save result:', error);
      }
    }
  }, [result]);

  const updateFormState = (field: keyof FormState, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formState.clientId) {
      alert('Please select a client');
      return;
    }
    if (!formState.prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await generateContent({
        clientId: formState.clientId,
        contentType: formState.contentType,
        customPrompt: formState.prompt,
        complexity: formState.complexity as 'simple' | 'medium' | 'complex',
        forceModel: formState.model || undefined,
        autoSave: formState.autoSave,
      });

      setResult(response);
    } catch (error) {
      console.error('Generation failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSave() {
    if (!result || !formState.clientId) return;

    setSaving(true);
    try {
      const saved = await saveGeneratedContent(
        formState.clientId,
        result.content,
        formState.contentType,
        {
          model_used: result.modelUsed,
          cost_usd: result.cost,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          prompt: formState.prompt,
        }
      );
      alert(`Saved to content library! ID: ${saved.id}`);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClear() {
    setFormState(prev => ({ ...prev, prompt: '' }));
    setResult(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RESULT_KEY);
    }
  }

  const selectedClient = clients.find(c => c.id === formState.clientId);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-primary/10 rounded-xl">
          <Sparkles className="w-8 h-8 text-red-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">AI Content Studio</h1>
          <p className="text-silver text-sm">Generate content with smart model selection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Panel */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Client Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Client *</label>
              {loadingClients ? (
                <div className="w-full p-3 border border-border rounded bg-surface flex items-center gap-2 text-silver">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading clients...
                </div>
              ) : clients.length === 0 ? (
                <div className="w-full p-3 border border-border rounded bg-surface text-silver">
                  No clients found. Create a client first.
                </div>
              ) : (
                <select
                  value={formState.clientId}
                  onChange={(e) => updateFormState('clientId', e.target.value)}
                  required
                  className="w-full p-3 border border-border rounded bg-surface"
                >
                  <option value="">Select a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Content Type</label>
              <select
                value={formState.contentType}
                onChange={(e) => updateFormState('contentType', e.target.value)}
                className="w-full p-3 border border-border rounded bg-surface"
              >
                <option value="email">📧 Email</option>
                <option value="ad">📢 Ad Copy</option>
                <option value="landing_page">🌐 Landing Page</option>
                <option value="blog_post">📝 Blog Post</option>
                <option value="social">📱 Social Media</option>
                <option value="headline">💡 Headlines</option>
                <option value="other">📄 Other</option>
              </select>
            </div>

            {/* Complexity */}
            <div>
              <label className="block text-sm font-medium mb-2">Task Complexity</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'simple', label: 'Simple', desc: 'Fast & Cheap', icon: '⚡' },
                  { value: 'medium', label: 'Medium', desc: 'Balanced', icon: '⚖️' },
                  { value: 'complex', label: 'Complex', desc: 'Best Quality', icon: '🎯' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFormState('complexity', opt.value)}
                    className={`p-3 border rounded text-center transition-all ${
                      formState.complexity === opt.value
                        ? 'border-red-primary bg-red-primary/10 text-red-primary'
                        : 'border-border hover:bg-surface'
                    }`}
                  >
                    <div className="text-lg">{opt.icon}</div>
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-silver">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Override (Advanced) */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-silver hover:text-foreground">
                Advanced: Force specific model
              </summary>
              <div className="mt-2">
                <select
                  value={formState.model}
                  onChange={(e) => updateFormState('model', e.target.value)}
                  className="w-full p-3 border border-border rounded bg-surface text-sm"
                >
                  <option value="">Auto-select best model</option>
                  <optgroup label="Fast & Cheap">
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Free)</option>
                    <option value="claude-haiku-4-20250514">Claude Haiku 4 ($0.25/1M)</option>
                  </optgroup>
                  <optgroup label="Balanced">
                    <option value="gemini-2.5-pro-002">Gemini 2.5 Pro ($1.25/1M)</option>
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4 ($3/1M)</option>
                  </optgroup>
                  <optgroup label="Premium">
                    <option value="claude-opus-4-20250514">Claude Opus 4 ($15/1M)</option>
                  </optgroup>
                </select>
              </div>
            </details>

            {/* Auto-save toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoSave"
                checked={formState.autoSave}
                onChange={(e) => updateFormState('autoSave', e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="autoSave" className="text-sm">
                Auto-save to content library
                {selectedClient && <span className="text-silver"> (for {selectedClient.name})</span>}
              </label>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">Your Prompt *</label>
              <textarea
                value={formState.prompt}
                onChange={(e) => updateFormState('prompt', e.target.value)}
                required
                rows={6}
                placeholder="Write a compelling email subject line and body for a Black Friday sale targeting business owners..."
                className="w-full p-3 border border-border rounded bg-surface resize-none"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-silver">{formState.prompt.length} characters</span>
                {formState.prompt.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-silver hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || loadingClients || clients.length === 0}
              className="w-full px-6 py-3 bg-red-primary text-white rounded-lg hover:bg-red-primary/90 disabled:opacity-50 font-medium transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Generate Content
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Result Panel */}
        <div>
          {result ? (
            <div className="border border-border rounded-lg bg-surface overflow-hidden">
              {/* Result Header */}
              <div className="p-4 border-b border-border bg-background flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Generated Content</h3>
                  <div className="text-xs text-silver mt-1">
                    {result.modelUsed} • ${result.cost.toFixed(6)} • {result.inputTokens + result.outputTokens} tokens
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setResult(null);
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem(RESULT_KEY);
                      }
                    }}
                    className="p-2 hover:bg-surface rounded transition-colors text-silver hover:text-foreground"
                    title="Clear result"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-surface rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {!result.savedAssetId && (
                    <button
                      onClick={handleManualSave}
                      disabled={saving}
                      className="p-2 hover:bg-surface rounded transition-colors"
                      title="Save to library"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="p-2 hover:bg-surface rounded transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Saved badge */}
              {result.savedAssetId && (
                <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 text-green-600 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Auto-saved to content library
                </div>
              )}

              {/* Result Content */}
              <div className="p-4 max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {result.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-12 text-center text-silver">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Generated content will appear here</p>
              <p className="text-xs mt-2">Your prompt and settings are saved automatically</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
