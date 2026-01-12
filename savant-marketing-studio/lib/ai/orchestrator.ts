import { createClient } from '@/lib/supabase/server';
import { ClaudeProvider } from './providers/claude';
import { GeminiProvider } from './providers/gemini';
import { BaseAIProvider, AIRequest, AIResponse } from './providers/base-provider';
import { calculateCost, getModelLabel } from './pricing';
import { logActivity } from '../activity-log';

export type TaskComplexity = 'simple' | 'medium' | 'complex';
export type TaskPriority = 'cost' | 'speed' | 'quality';

interface AITask {
  type: string;
  complexity: TaskComplexity;
  priority?: TaskPriority;
  clientId?: string;
  request: AIRequest;
  forceModel?: string;
}

interface ModelSelection {
  providerId: string;
  modelId: string;
  modelName: string;
  provider: BaseAIProvider;
  costPer1MInput: number;
  costPer1MOutput: number;
}

export class AIOrchestrator {
  private providers: Map<string, BaseAIProvider>;

  constructor() {
    this.providers = new Map<string, BaseAIProvider>([
      ['claude', new ClaudeProvider()],
      ['gemini', new GeminiProvider()],
    ]);
  }

  /**
   * Main entry point - executes AI task with optimal model selection
   * Includes automatic fallback if primary model fails (rate limit, etc.)
   */
  async executeTask(task: AITask): Promise<AIResponse & { cost: number; modelUsed: string }> {
    const supabase = await createClient();
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Select best model for task
    let selection = task.forceModel 
      ? await this.getModelByName(task.forceModel)
      : await this.selectModel(task.complexity, task.priority || 'quality');

    const startTime = Date.now();
    let response: AIResponse | null = null;
    let error: string | null = null;
    let usedFallback = false;

    try {
      // Attempt primary model
      response = await selection.provider.generateText(task.request, selection.modelName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if it's a rate limit error (429) - fallback to Claude Haiku
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate')) {
        
        // Fallback to Claude 4.5 Haiku (fast, cheap, reliable)
        try {
          selection = await this.getModelByName('claude-haiku-4-5-20251001');
          response = await selection.provider.generateText(task.request, selection.modelName);
          usedFallback = true;
        } catch (fallbackErr) {
          error = fallbackErr instanceof Error ? fallbackErr.message : 'Fallback also failed';
          throw new Error(`AI execution failed (primary and fallback): ${error}`);
        }
      } else {
        error = errorMessage;
        throw new Error(`AI execution failed: ${error}`);
      }
    }

    if (!response) {
      throw new Error('No response from AI');
    }

    // Calculate cost using centralized pricing
    const cost = calculateCost(
      selection.modelName,
      response.inputTokens,
      response.outputTokens
    );

    // Log execution
    const { data: execution, error: insertError } = await supabase.from('ai_executions').insert({
      user_id: user.id,
      client_id: task.clientId || null,
      model_id: selection.modelId,
      task_type: task.type,
      complexity: task.complexity,
      input_data: {
        messages: task.request.messages,
        maxTokens: task.request.maxTokens,
        temperature: task.request.temperature,
        usedFallback,
        useExtendedThinking: task.request.useExtendedThinking,
        thinkingBudget: task.request.thinkingBudget,
      },
      output_data: { content: response.content },
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
      total_cost_usd: cost,
      duration_ms: Date.now() - startTime,
      status: 'success',
    }).select('id').single();

    // Log to activity feed
    if (execution?.id) {
      const modelLabel = getModelLabel(selection.modelName);
      const totalTokens = response.inputTokens + response.outputTokens;
      
      // Format task type for display
      const taskTypeLabel = task.type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      await logActivity({
        activityType: 'ai_generation',
        entityType: 'ai_execution',
        entityId: execution.id,
        entityName: `${taskTypeLabel} (${modelLabel})`,
        clientId: task.clientId,
        metadata: {
          model: selection.modelName,
          model_label: modelLabel,
          tokens: totalTokens,
          input_tokens: response.inputTokens,
          output_tokens: response.outputTokens,
          cost: cost,
          generation_type: task.type,
          complexity: task.complexity,
          duration_ms: Date.now() - startTime,
          used_fallback: usedFallback,
        },
      });
    }

    return {
      ...response,
      cost,
      modelUsed: selection.modelName + (usedFallback ? ' (fallback)' : ''),
    };
  }

  /**
   * Select optimal model based on task complexity and priority
   */
  private async selectModel(
    complexity: TaskComplexity,
    priority: TaskPriority
  ): Promise<ModelSelection> {
    const supabase = await createClient();
    if (!supabase) throw new Error('Supabase not configured');

    const { data: models } = await supabase
      .from('ai_models')
      .select(`
        id,
        model_name,
        model_tier,
        cost_per_1m_input,
        cost_per_1m_output,
        ai_providers!inner(id, name)
      `)
      .eq('is_active', true)
      .eq('ai_providers.is_active', true);

    if (!models || models.length === 0) {
      throw new Error('No active AI models available');
    }

    let selectedModel;

    if (complexity === 'simple') {
      if (priority === 'cost') {
        // Try Gemini Flash first (free), but Claude 4.5 Haiku is reliable fallback
        selectedModel = models.find(m => m.model_name === 'gemini-2.0-flash-exp') || 
                       models.find(m => m.model_name === 'claude-haiku-4-5-20251001') ||
                       models[0];
      } else {
        // Fast but reliable: Claude 4.5 Haiku
        selectedModel = models.find(m => m.model_name === 'claude-haiku-4-5-20251001') ||
                       models.find(m => m.model_tier === 'fast') || 
                       models[0];
      }
    } else if (complexity === 'medium') {
      if (priority === 'cost') {
        selectedModel = models.find(m => m.model_name === 'gemini-2.5-pro-002') || 
                       models.find(m => m.model_name === 'claude-sonnet-4-5-20250929') ||
                       models[0];
      } else {
        selectedModel = models.find(m => m.model_name === 'claude-sonnet-4-5-20250929') || models[0];
      }
    } else {
      // Complex: Always use best (Claude 4.5 Opus)
      selectedModel = models.find(m => m.model_name === 'claude-opus-4-5-20251101') || models[0];
    }

    const providerName = (selectedModel.ai_providers as unknown as { name: string }).name;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider ${providerName} not initialized`);
    }

    return {
      providerId: (selectedModel.ai_providers as unknown as { id: string }).id,
      modelId: selectedModel.id,
      modelName: selectedModel.model_name,
      provider,
      costPer1MInput: Number(selectedModel.cost_per_1m_input),
      costPer1MOutput: Number(selectedModel.cost_per_1m_output),
    };
  }

  /**
   * Get specific model by name (for manual override)
   */
  private async getModelByName(modelName: string): Promise<ModelSelection> {
    const supabase = await createClient();
    if (!supabase) throw new Error('Supabase not configured');

    const { data: model } = await supabase
      .from('ai_models')
      .select(`
        id,
        model_name,
        cost_per_1m_input,
        cost_per_1m_output,
        ai_providers!inner(id, name)
      `)
      .eq('model_name', modelName)
      .eq('is_active', true)
      .single();

    if (!model) {
      throw new Error(`Model ${modelName} not found or inactive`);
    }

    const providerName = (model.ai_providers as unknown as { name: string }).name;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider ${providerName} not initialized`);
    }

    return {
      providerId: (model.ai_providers as unknown as { id: string }).id,
      modelId: model.id,
      modelName: model.model_name,
      provider,
      costPer1MInput: Number(model.cost_per_1m_input),
      costPer1MOutput: Number(model.cost_per_1m_output),
    };
  }
}
