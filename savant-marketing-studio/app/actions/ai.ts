'use server';

import { AIOrchestrator, TaskComplexity } from '@/lib/ai/orchestrator';
import { searchFrameworks } from '@/lib/ai/rag';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  getUserAISpend, 
  getClientAISpend, 
  getRecentAISpend,
  formatCost,
  getModelLabel
} from '@/lib/ai/pricing';

export interface GenerateContentParams {
  clientId: string;
  contentType: string;
  customPrompt: string;
  complexity?: TaskComplexity;
  forceModel?: string;
  autoSave?: boolean; // NEW: Auto-save to content library
  projectId?: string; // NEW: Link to specific project
}

export interface GenerateContentResult {
  content: string;
  modelUsed: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  savedAssetId?: string; // NEW: ID of saved content asset
}

export async function generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
  const {
    clientId,
    contentType,
    customPrompt,
    complexity = 'medium',
    forceModel,
    autoSave = false,
    projectId,
  } = params;

  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');
  
  // Get client data (from questionnaire)
  const { data: client } = await supabase
    .from('clients')
    .select('name, intake_responses, brand_data')
    .eq('id', clientId)
    .single();

  if (!client) {
    throw new Error('Client not found');
  }

  // Search frameworks for relevant context (RAG)
  let frameworkContext = '';
  try {
    const frameworkChunks = await searchFrameworks(customPrompt, 0.7, 5);
    frameworkContext = frameworkChunks
      .map(chunk => chunk.content)
      .join('\n\n');
  } catch (error) {
    console.error('RAG search failed (continuing without framework context):', error);
  }

  // Build context-aware prompt
  const systemPrompt = `You are a professional copywriter generating ${contentType} content for "${client.name}".

${client.brand_data ? `CLIENT BRAND CONTEXT:
${JSON.stringify(client.brand_data, null, 2)}` : ''}

${frameworkContext ? `RELEVANT FRAMEWORKS:
${frameworkContext}` : ''}

Generate content that:
1. Matches the client's brand voice (if available)
2. Follows proven copywriting frameworks
3. Is ready to use with minimal editing
4. Achieves the stated goal

Output ONLY the requested content, no explanations or meta-commentary.`;

  // Execute AI task
  const orchestrator = new AIOrchestrator();
  const result = await orchestrator.executeTask({
    type: 'content_generation',
    complexity,
    clientId,
    forceModel,
    request: {
      messages: [
        { role: 'user', content: customPrompt }
      ],
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt,
    },
  });

  let savedAssetId: string | undefined;

  // Auto-save to content library if requested
  if (autoSave) {
    const { data: savedAsset, error: saveError } = await supabase
      .from('content_assets')
      .insert({
        client_id: clientId,
        project_id: projectId || null,
        title: `AI Generated: ${contentType} - ${new Date().toLocaleDateString()}`,
        asset_type: mapContentTypeToAssetType(contentType),
        content_json: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: result.content }]
            }
          ]
        },
        metadata: {
          ai_generated: true,
          model_used: result.modelUsed,
          cost_usd: result.cost,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          prompt: customPrompt,
          generated_at: new Date().toISOString(),
        }
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Failed to auto-save content:', saveError);
    } else {
      savedAssetId = savedAsset?.id;
      revalidatePath(`/dashboard/clients/${clientId}/content`);
    }
  }

  return {
    content: result.content,
    modelUsed: result.modelUsed,
    cost: result.cost,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    savedAssetId,
  };
}

// Map content types to asset types in content_assets table
function mapContentTypeToAssetType(contentType: string): string {
  const mapping: Record<string, string> = {
    email: 'email',
    ad: 'ad_copy',
    landing_page: 'landing_page',
    blog_post: 'blog_post',
    social: 'note',
    headline: 'note',
    other: 'note',
  };
  return mapping[contentType] || 'note';
}

// Save generated content manually (if not auto-saved)
export async function saveGeneratedContent(
  clientId: string,
  content: string,
  contentType: string,
  metadata: Record<string, unknown>
): Promise<{ id: string }> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('content_assets')
    .insert({
      client_id: clientId,
      title: `AI Generated: ${contentType} - ${new Date().toLocaleDateString()}`,
      asset_type: mapContentTypeToAssetType(contentType),
      content_json: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: content }]
          }
        ]
      },
      metadata: {
        ...metadata,
        ai_generated: true,
        saved_at: new Date().toISOString(),
      }
    })
    .select('id')
    .single();

  if (error) {
    throw new Error('Failed to save content');
  }

  revalidatePath(`/dashboard/clients/${clientId}/content`);
  return { id: data.id };
}

// Get clients for dropdown
export async function getClientsForDropdown(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch clients:', error);
    return [];
  }

  return data || [];
}

// Get AI usage stats
export async function getAIUsageStats() {
  const supabase = await createClient();
  if (!supabase) return { totalCost: 0, totalTokens: 0, totalGenerations: 0 };
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const { data } = await supabase
    .from('ai_executions')
    .select('total_cost_usd, input_tokens, output_tokens, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .eq('status', 'success');

  if (!data) return { totalCost: 0, totalTokens: 0, totalGenerations: 0 };

  const totalCost = data.reduce((sum, e) => sum + Number(e.total_cost_usd || 0), 0);
  const totalTokens = data.reduce((sum, e) => sum + (e.input_tokens || 0) + (e.output_tokens || 0), 0);

  return {
    totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places for display
    totalTokens,
    totalGenerations: data.length,
  };
}

// Get detailed AI spend for current user
export async function getMyAISpend(options?: {
  clientId?: string
  startDate?: Date
  endDate?: Date
}) {
  const supabase = await createClient();
  if (!supabase) {
    return { totalCost: 0, totalTokens: 0, executionCount: 0, byModel: {} };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { totalCost: 0, totalTokens: 0, executionCount: 0, byModel: {} };
  }
  
  return getUserAISpend(user.id, options);
}

// Get AI spend for a specific client
export async function getClientAICost(clientId: string) {
  return getClientAISpend(clientId);
}

// Get recent AI spend (last 30 days)
export async function getMyRecentAISpend() {
  const supabase = await createClient();
  if (!supabase) {
    return { totalCost: 0, totalTokens: 0, executionCount: 0, byModel: {} };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { totalCost: 0, totalTokens: 0, executionCount: 0, byModel: {} };
  }
  
  return getRecentAISpend(user.id);
}

// Format cost for display
export async function formatAICost(cost: number): Promise<string> {
  return formatCost(cost);
}

// Get model label
export async function getAIModelLabel(modelId: string): Promise<string> {
  return getModelLabel(modelId);
}

// Generate inline edit (for AI prompt bar)
export interface InlineEditContext {
  selectedText?: string;
  fullContent: string;
  clientId?: string;
  includeClientContext?: boolean;
  frameworkId?: string;
  model?: string;
}

export async function generateInlineEdit(
  prompt: string,
  context: InlineEditContext
): Promise<{ content: string; error?: string }> {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error('Supabase not configured');

    // Build context for the AI
    let systemPrompt = `You are an expert copywriter and content editor. Your task is to help improve, edit, or generate content based on the user's request.`;

    // Add client context if requested and available
    if (context.includeClientContext && context.clientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('name, brand_data, intake_responses')
        .eq('id', context.clientId)
        .single();

      if (client) {
        systemPrompt += `\n\nCLIENT BRAND CONTEXT for "${client.name}":`;
        
        if (client.brand_data) {
          systemPrompt += `\n${JSON.stringify(client.brand_data, null, 2)}`;
        }
        
        if (client.intake_responses) {
          systemPrompt += `\n\nClient Questionnaire Responses:\n${JSON.stringify(client.intake_responses, null, 2)}`;
        }
      }
    }

    // Add framework context if requested
    if (context.frameworkId) {
      try {
        const frameworkChunks = await searchFrameworks(prompt, 0.7, 3);
        if (frameworkChunks.length > 0) {
          systemPrompt += `\n\nRELEVANT COPYWRITING FRAMEWORKS:\n`;
          systemPrompt += frameworkChunks.map(chunk => chunk.content).join('\n\n');
        }
      } catch (error) {
        console.error('Framework search failed:', error);
      }
    }

    systemPrompt += `\n\nGuidelines:
1. Respond ONLY with the edited/generated content - no explanations or meta-commentary
2. Maintain the same format/structure unless asked to change it
3. If working with selected text, focus on that specific portion
4. Match any existing brand voice or tone if context is provided
5. Be concise and direct`;

    // Build the user message
    let userMessage = prompt;
    
    if (context.selectedText) {
      userMessage += `\n\nSELECTED TEXT TO WORK WITH:\n${context.selectedText}`;
    }
    
    if (context.fullContent && context.fullContent !== context.selectedText) {
      userMessage += `\n\nFULL CONTENT FOR CONTEXT:\n${context.fullContent}`;
    }

    // Execute AI task with specified model
    const orchestrator = new AIOrchestrator();
    const result = await orchestrator.executeTask({
      type: 'inline_edit',
      complexity: 'simple',
      clientId: context.clientId,
      forceModel: context.model, // Use specified model if provided
      request: {
        messages: [
          { role: 'user', content: userMessage }
        ],
        maxTokens: 2048,
        temperature: 0.7,
        systemPrompt,
      },
    });

    return {
      content: result.content,
    };
  } catch (error) {
    console.error('Inline edit generation failed:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Failed to generate content',
    };
  }
}
