'use server';

import { AIOrchestrator, TaskComplexity } from '@/lib/ai/orchestrator';
import { searchFrameworks } from '@/lib/ai/rag';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  formatCost,
  getModelLabel,
  AI_PRICING,
  AIModelId
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
    // Direct matches
    email: 'email',
    ad: 'ad_copy',
    social: 'social_post',
    other: 'note',
    // UI shorthand values
    landing: 'landing_page',
    blog: 'blog_post',
    // Full values (for backward compatibility)
    landing_page: 'landing_page',
    blog_post: 'blog_post',
    ad_copy: 'ad_copy',
    social_post: 'social_post',
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
  
  let query = supabase
    .from('ai_executions')
    .select('model_id, input_tokens, output_tokens, total_cost_usd')
    .eq('user_id', user.id);
  
  if (options?.clientId) {
    query = query.eq('client_id', options.clientId);
  }
  
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }
  
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }
  
  const { data: executions, error } = await query;
  
  if (error || !executions) {
    console.error('Error fetching AI spend:', error);
    return { totalCost: 0, totalTokens: 0, executionCount: 0, byModel: {} };
  }
  
  const byModel: Record<string, { cost: number; tokens: number; count: number }> = {};
  let totalCost = 0;
  let totalTokens = 0;
  
  executions.forEach(exec => {
    const cost = exec.total_cost_usd || 0;
    const tokens = (exec.input_tokens || 0) + (exec.output_tokens || 0);
    
    totalCost += cost;
    totalTokens += tokens;
    
    const modelId = exec.model_id || 'unknown';
    if (!byModel[modelId]) {
      byModel[modelId] = { cost: 0, tokens: 0, count: 0 };
    }
    byModel[modelId].cost += cost;
    byModel[modelId].tokens += tokens;
    byModel[modelId].count += 1;
  });
  
  return {
    totalCost: Math.round(totalCost * 1000000) / 1000000,
    totalTokens,
    executionCount: executions.length,
    byModel
  };
}

// Get AI spend for a specific client
export async function getClientAICost(clientId: string) {
  const supabase = await createClient();
  
  if (!supabase) {
    return { totalCost: 0, totalTokens: 0, executionCount: 0 };
  }
  
  const { data, error } = await supabase
    .from('ai_executions')
    .select('input_tokens, output_tokens, total_cost_usd')
    .eq('client_id', clientId);
  
  if (error || !data) {
    console.error('Error fetching client AI spend:', error);
    return { totalCost: 0, totalTokens: 0, executionCount: 0 };
  }
  
  return {
    totalCost: data.reduce((sum, e) => sum + (e.total_cost_usd || 0), 0),
    totalTokens: data.reduce((sum, e) => sum + (e.input_tokens || 0) + (e.output_tokens || 0), 0),
    executionCount: data.length
  };
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
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return getMyAISpend({ startDate: thirtyDaysAgo });
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
  // Multi-selection support
  selections?: Array<{
    text: string;
    from: number;
    to: number;
  }>;
  // Keep old field for backward compatibility
  selectedText?: string;
  fullContent: string;
  clientId?: string;
  includeClientContext?: boolean;
  frameworkId?: string;
  model?: string;
  // Context injection via mentions
  mentions?: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  // Extended thinking for deeper reasoning
  useExtendedThinking?: boolean;
}

// Edit result for multi-selection
export interface InlineEditResult {
  content: string;
  edits?: Array<{
    original: string;
    edited: string;
    from: number;
    to: number;
  }>;
  error?: string;
  // Token usage from API
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export async function generateInlineEdit(
  prompt: string,
  context: InlineEditContext
): Promise<InlineEditResult> {
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error('Supabase not configured');

    // Build context for the AI
    let systemPrompt = `You are an expert copywriter and content editor. Your task is to help improve, edit, or generate content based on the user's request.`;

    // Build context from mentions
    let mentionContextText = '';
    if (context.mentions && context.mentions.length > 0) {
      const contextParts: string[] = [];
      
      for (const mention of context.mentions) {
        if (mention.type === 'client') {
          const { data: client } = await supabase
            .from('clients')
            .select('name, brand_data, intake_responses')
            .eq('id', mention.id)
            .single();
          if (client) {
            let clientContext = `## Client: ${client.name}`;
            if (client.brand_data) {
              clientContext += `\n### Brand Data\n${JSON.stringify(client.brand_data, null, 2)}`;
            }
            if (client.intake_responses) {
              clientContext += `\n### Intake Responses\n${JSON.stringify(client.intake_responses, null, 2)}`;
            }
            contextParts.push(clientContext);
          }
        } else if (mention.type === 'project') {
          const { data: project } = await supabase
            .from('projects')
            .select('name, description, status, client_id')
            .eq('id', mention.id)
            .single();
          if (project) {
            let projectContext = `## Project: ${project.name}\nStatus: ${project.status || 'Unknown'}\n${project.description || 'No description'}`;
            
            // Auto-fetch client brand data if project has a client
            // and that client wasn't already mentioned
            if (project.client_id) {
              const alreadyHasClient = context.mentions?.some(
                m => m.type === 'client' && m.id === project.client_id
              );
              
              if (!alreadyHasClient) {
                const { data: client } = await supabase
                  .from('clients')
                  .select('name, brand_data, intake_responses, industry, website')
                  .eq('id', project.client_id)
                  .single();
                
                if (client) {
                  projectContext += `\n\n### Client Context (from project): ${client.name}`;
                  if (client.industry) projectContext += `\nIndustry: ${client.industry}`;
                  if (client.website) projectContext += `\nWebsite: ${client.website}`;
                  if (client.brand_data) {
                    projectContext += `\n#### Brand Data\n\`\`\`json\n${JSON.stringify(client.brand_data, null, 2)}\n\`\`\``;
                  }
                  if (client.intake_responses) {
                    projectContext += `\n#### Intake Responses\n\`\`\`json\n${JSON.stringify(client.intake_responses, null, 2)}\n\`\`\``;
                  }
                }
              }
            }
            
            contextParts.push(projectContext);
          }
        } else if (mention.type === 'content') {
          const { data: content } = await supabase
            .from('content_assets')
            .select('title, content, content_json, asset_type')
            .eq('id', mention.id)
            .single();
          if (content) {
            // Try to get text content from content_json or fall back to content field
            let textContent = content.content || '';
            if (!textContent && content.content_json) {
              // Extract text from TipTap JSON
              try {
                const extractText = (node: unknown): string => {
                  if (!node || typeof node !== 'object') return '';
                  const n = node as { type?: string; text?: string; content?: unknown[] };
                  if (n.type === 'text' && n.text) return n.text;
                  if (n.content && Array.isArray(n.content)) {
                    return n.content.map(extractText).join(' ');
                  }
                  return '';
                };
                textContent = extractText(content.content_json);
              } catch {
                textContent = JSON.stringify(content.content_json);
              }
            }
            contextParts.push(`## Content: ${content.title}\nType: ${content.asset_type || 'Unknown'}\n${textContent}`);
          }
        } else if (mention.type === 'capture') {
          const { data: entry } = await supabase
            .from('journal_entries')
            .select('title, content')
            .eq('id', mention.id)
            .single();
          if (entry) {
            contextParts.push(`## Journal Entry: ${entry.title || 'Untitled'}\n${entry.content}`);
          }
        } else if (mention.type === 'framework' || mention.type === 'writing-framework') {
          const { data: framework } = await supabase
            .from('marketing_frameworks')
            .select('name, content, description')
            .eq('id', mention.id)
            .single();
          if (framework) {
            contextParts.push(`## Framework: ${framework.name}\n${framework.content || framework.description || 'No content'}`);
          }
        }
      }
      
      if (contextParts.length > 0) {
        mentionContextText = `\n\n# CONTEXT FROM MENTIONS\n\n${contextParts.join('\n\n---\n\n')}`;
      }
    }

    // Add client context if requested and available (and not already added via mentions)
    const clientAlreadyInMentions = context.mentions?.some(m => m.type === 'client' && m.id === context.clientId);
    if (context.includeClientContext && context.clientId && !clientAlreadyInMentions) {
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

    // Add mention context to system prompt
    if (mentionContextText) {
      systemPrompt += mentionContextText;
    }

    // Check if we have multiple selections
    const hasMultipleSelections = context.selections && context.selections.length > 0;

    if (hasMultipleSelections) {
      // Multi-selection mode: Ask AI to edit each selection independently
      systemPrompt += `\n\nYou are editing specific text selections in a document. 
Apply the following edit instruction to EACH selection independently.

Guidelines:
1. Apply the edit instruction to each selection separately
2. Maintain the context and meaning appropriate to each selection
3. Keep the same general tone/style across all edits
4. Return your response as valid JSON only - no markdown, no explanations`;

      const selectionsPrompt = context.selections!
        .map((s, i) => `Selection ${i + 1}: "${s.text}"`)
        .join('\n');

      const userMessage = `Edit instruction: ${prompt}

Selections to edit:
${selectionsPrompt}

${context.fullContent ? `\nFull document context:\n${context.fullContent}` : ''}

Respond with ONLY a valid JSON object in this exact format (no markdown code blocks):
{"edits":[{"index":0,"original":"original text","edited":"edited text"},{"index":1,"original":"original text","edited":"edited text"}]}`;

      // Execute AI task with specified model
      const orchestrator = new AIOrchestrator();
      const result = await orchestrator.executeTask({
        type: 'inline_edit',
        complexity: 'simple',
        clientId: context.clientId,
        forceModel: context.model,
        request: {
          messages: [
            { role: 'user', content: userMessage }
          ],
          maxTokens: 4096,
          temperature: 0.7,
          systemPrompt,
          useExtendedThinking: context.useExtendedThinking || false,
        },
      });

      // Parse the JSON response
      try {
        // Clean up the response - remove markdown code blocks if present
        let cleanContent = result.content.trim();
        
        // Remove markdown code block wrappers if present
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.slice(7);
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.slice(3);
        }
        if (cleanContent.endsWith('```')) {
          cleanContent = cleanContent.slice(0, -3);
        }
        cleanContent = cleanContent.trim();
        
        const parsed = JSON.parse(cleanContent);
        
        if (parsed.edits && Array.isArray(parsed.edits)) {
          const edits = parsed.edits.map((edit: { index: number; original: string; edited: string }, i: number) => ({
            original: edit.original || context.selections![edit.index]?.text || '',
            edited: edit.edited,
            from: context.selections![edit.index]?.from || 0,
            to: context.selections![edit.index]?.to || 0,
          }));

          return {
            content: '',
            edits,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            totalTokens: result.inputTokens + result.outputTokens,
          };
        } else {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        console.error('Failed to parse multi-edit response:', parseError);
        console.error('Raw response:', result.content);
        
        // Fallback: treat as single edit for all selections
        return {
          content: result.content,
          error: 'Failed to parse multi-edit response. Try with fewer selections.',
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          totalTokens: result.inputTokens + result.outputTokens,
        };
      }
    } else {
      // Single selection mode (backward compatibility)
      systemPrompt += `\n\nGuidelines:
1. Respond ONLY with the edited/generated content - no explanations or meta-commentary
2. Maintain the same format/structure unless asked to change it
3. If working with selected text, focus on that specific portion
4. Match any existing brand voice or tone if context is provided
5. Be concise and direct`;

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
        forceModel: context.model,
        request: {
          messages: [
            { role: 'user', content: userMessage }
          ],
          maxTokens: 2048,
          temperature: 0.7,
          systemPrompt,
          useExtendedThinking: context.useExtendedThinking || false,
        },
      });

      return {
        content: result.content,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.inputTokens + result.outputTokens,
      };
    }
  } catch (error) {
    console.error('Inline edit generation failed:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Failed to generate content',
    };
  }
}
