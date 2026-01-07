'use server';

import { AIOrchestrator, TaskComplexity } from '@/lib/ai/orchestrator';
import { searchFrameworks } from '@/lib/ai/rag';
import { performWebResearch, WebSource } from '@/lib/ai/web-research';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getModelIdFromName, getDefaultModelId } from '@/lib/ai/model-lookup';

// Research phases for progress tracking
export type ResearchPhase = 
  | 'initializing'
  | 'generating_queries'
  | 'searching_frameworks'
  | 'gathering_client_data'
  | 'generating_report'
  | 'complete'
  | 'error';

export interface ResearchParams {
  topic: string;
  clientId?: string;
  depth?: 'quick' | 'standard' | 'comprehensive';
  useWebSearch?: boolean; // NEW: Enable real web search via Gemini grounding
}

export interface ResearchResult {
  report: string;
  modelUsed: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  savedAssetId?: string;
  frameworksUsed: string[];
  webSources?: WebSource[]; // NEW: Actual web sources if web search was used
  searchQueries?: string[]; // NEW: Search queries performed
  groundingSupport?: number; // NEW: How much of response is grounded (0-1)
  clientContext?: {
    name: string;
    hasIntakeData: boolean;
    hasBrandData: boolean;
  };
}

/**
 * Generate a research plan before execution (Gemini-style)
 */
export async function generateResearchPlan(
  topic: string,
  mode: 'quick' | 'standard' | 'comprehensive'
): Promise<{ items: string[]; estimatedTime: string; estimatedSources: string }> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Mode-specific configuration
  const modeConfig = {
    quick: {
      itemCount: 3,
      instruction: 'Focus on the 3 most important points only. Be concise and prioritize key insights.',
      estimatedTime: '~30 seconds',
      estimatedSources: '3-5',
    },
    standard: {
      itemCount: 5,
      instruction: 'Cover the main aspects comprehensively with balanced depth.',
      estimatedTime: '~1-2 minutes',
      estimatedSources: '8-12',
    },
    comprehensive: {
      itemCount: 7,
      instruction: 'Provide exhaustive coverage including edge cases, statistics, expert opinions, and counterarguments.',
      estimatedTime: '~3-5 minutes',
      estimatedSources: '15-20',
    },
  }[mode];

  const planPrompt = `You are a research planning assistant. Create a focused research plan for this topic.

Topic: ${topic}
Research Mode: ${mode}

Generate EXACTLY ${modeConfig.itemCount} specific subtopics or angles to research. Each should be a complete sentence describing what you'll investigate.

${modeConfig.instruction}

Format your response as a numbered list:
1. [First subtopic]
2. [Second subtopic]
etc.

Be specific and actionable. Focus on what's most important for this topic.`;

  const orchestrator = new AIOrchestrator();
  const result = await orchestrator.executeTask({
    type: 'research_planning',
    complexity: 'simple',
    request: {
      messages: [{ role: 'user', content: planPrompt }],
      maxTokens: 500,
      temperature: 0.7,
    },
  });

  // Parse the response into plan items
  const lines = result.content
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\d+\./.test(line)) // Lines starting with numbers
    .map(line => line.replace(/^\d+\.\s*/, '')); // Remove numbers

  const items = lines.slice(0, modeConfig.itemCount); // Mode-specific count

  // Fallback if parsing fails - use mode-specific defaults
  if (items.length === 0) {
    const fallbackItems = {
      quick: [
        'Key best practices and current trends',
        'Industry benchmarks and standards',
        'Critical success factors',
      ],
      standard: [
        'Current best practices and emerging trends',
        'Industry standards and benchmarks',
        'Successful case studies and examples',
        'Common challenges and proven solutions',
        'Key metrics and KPIs to track',
      ],
      comprehensive: [
        'Historical context and evolution of the field',
        'Current best practices with statistical backing',
        'Industry standards and regulatory considerations',
        'Detailed case studies from leading organizations',
        'Common challenges with multiple solution approaches',
        'Advanced strategies and cutting-edge techniques',
        'Future trends and expert predictions',
      ],
    }[mode];

    return {
      items: fallbackItems,
      estimatedTime: modeConfig.estimatedTime,
      estimatedSources: modeConfig.estimatedSources,
    };
  }

  return {
    items,
    estimatedTime: modeConfig.estimatedTime,
    estimatedSources: modeConfig.estimatedSources,
  };
}

/**
 * Perform deep research on a topic using AI, frameworks, and optionally client context
 * NEW: Can use real web search via Gemini grounding
 */
export async function performDeepResearch(params: ResearchParams): Promise<ResearchResult> {
  const { topic, clientId, depth = 'standard', useWebSearch = true } = params;

  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create mutable variable for web search decision (can be changed on fallback)
  let shouldUseWebSearch = useWebSearch;

  // PHASE 1: Get client data if specified
  let clientContext: ResearchResult['clientContext'];
  let clientData: { name: string; intake_responses: unknown; brand_data: unknown } | null = null;

  if (clientId) {
    const { data: client } = await supabase
      .from('clients')
      .select('name, intake_responses, brand_data')
      .eq('id', clientId)
      .single();

    if (client) {
      clientData = client;
      clientContext = {
        name: client.name,
        hasIntakeData: !!client.intake_responses,
        hasBrandData: !!client.brand_data,
      };
    }
  }

  // PHASE 2: Search frameworks for relevant context (RAG)
  let frameworkContext = '';
  const frameworksUsed: string[] = [];
  
  try {
    const matchCount = depth === 'comprehensive' ? 10 : depth === 'standard' ? 5 : 3;
    const frameworkChunks = await searchFrameworks(topic, 0.65, matchCount);
    
    if (frameworkChunks.length > 0) {
      frameworkContext = frameworkChunks
        .map(chunk => chunk.content)
        .join('\n\n---\n\n');
      
      // Get unique framework IDs
      const uniqueIds = [...new Set(frameworkChunks.map(c => c.framework_id))];
      frameworksUsed.push(...uniqueIds);
    }
  } catch (error) {
    console.error('RAG search failed (continuing without framework context):', error);
  }

  // PHASE 3: Execute research - WEB SEARCH or AI-only
  let result: any;
  let webSources: WebSource[] | undefined;
  let searchQueries: string[] | undefined;
  let groundingSupport: number | undefined;
  let modelUsed: string = 'unknown'; // Initialize with default

  if (shouldUseWebSearch) {
    // Use REAL web search via Gemini grounding
    
    try {
      const webResult = await performWebResearch(topic, depth);
      
      // Enhance web research with client context if available
      let enhancedContent = webResult.content;
      if (clientData) {
        enhancedContent = `# Research for ${clientData.name}\n\n${enhancedContent}`;
      }
      
      result = {
        content: enhancedContent,
        inputTokens: webResult.inputTokens,
        outputTokens: webResult.outputTokens,
        cost: 0, // Will calculate below
      };
      
      webSources = webResult.sources;
      searchQueries = webResult.searchQueries;
      groundingSupport = webResult.groundingSupport;
      
      // Set model name based on depth (matches web-research.ts logic)
      const actualModel = depth === 'quick' ? 'gemini-1.5-flash' : 'gemini-1.5-pro';
      modelUsed = `${actualModel} (web-grounded)`;
      
      // Calculate cost based on actual model used
      // Gemini 1.5 Flash: $0.075/$0.30 per 1M tokens (input/output)
      // Gemini 1.5 Pro: $1.25/$5.00 per 1M tokens (input/output)
      const costPer1MInput = depth === 'quick' ? 0.075 : 1.25;
      const costPer1MOutput = depth === 'quick' ? 0.30 : 5.0;
      result.cost = (webResult.inputTokens / 1_000_000 * costPer1MInput) + 
                    (webResult.outputTokens / 1_000_000 * costPer1MOutput);
    } catch (error) {
      console.error('Web search failed, falling back to AI-only research:', error);
      // Fall back to AI-only if web search fails
      shouldUseWebSearch = false;
    }
  }
  
  if (!shouldUseWebSearch) {
    // FALLBACK: Use AI-only research (original implementation)
    
    const complexity: TaskComplexity = depth === 'comprehensive' ? 'complex' : depth === 'standard' ? 'medium' : 'simple';

    const systemPrompt = buildResearchSystemPrompt(depth);
    const userPrompt = buildResearchUserPrompt({
      topic,
      clientData,
      frameworkContext,
      depth,
    });

    // Execute AI research via orchestrator
    const orchestrator = new AIOrchestrator();
    result = await orchestrator.executeTask({
      type: 'deep_research',
      complexity,
      clientId,
      request: {
        messages: [
          { role: 'user', content: userPrompt }
        ],
        maxTokens: depth === 'comprehensive' ? 8192 : depth === 'standard' ? 4096 : 2048,
        temperature: 0.7,
        systemPrompt,
      },
    });
    
    modelUsed = result.modelUsed;
  }

  // PHASE 5: Save to content_assets as research_report
  let savedAssetId: string | undefined;

  if (clientId) {
    const { data: savedAsset, error: saveError } = await supabase
      .from('content_assets')
      .insert({
        client_id: clientId,
        title: `Research: ${topic.substring(0, 50)}${topic.length > 50 ? '...' : ''} - ${new Date().toLocaleDateString()}`,
        asset_type: 'research_report',
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
          research_topic: topic,
          research_depth: depth,
          ai_generated: true,
          model_used: modelUsed,
          cost_usd: result.cost,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          frameworks_used: frameworksUsed,
          web_sources: webSources || [],
          search_queries: searchQueries || [],
          grounding_support: groundingSupport,
          used_web_search: shouldUseWebSearch,
          generated_at: new Date().toISOString(),
        }
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Failed to auto-save research:', saveError);
    } else {
      savedAssetId = savedAsset?.id;
      revalidatePath(`/dashboard/clients/${clientId}/content`);
    }
  }

  // Log to ai_executions for analytics (migrated from ai_generations)
  const modelId = await getModelIdFromName(modelUsed) || await getDefaultModelId();
  
  if (modelId) {
    await supabase.from('ai_executions').insert({
      user_id: user.id,
      client_id: clientId || null,
      model_id: modelId,
      task_type: 'research',
      complexity: depth === 'comprehensive' ? 'complex' : depth === 'standard' ? 'medium' : 'simple',
      input_data: { 
        topic,
        depth,
        frameworks_count: frameworksUsed.length,
        had_client_data: !!clientData,
        used_web_search: shouldUseWebSearch,
      },
      output_data: { 
        report: result.content,
        web_sources: webSources || [],
        search_queries: searchQueries || [],
        sources_count: webSources?.length || 0,
      },
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      total_cost_usd: result.cost,
      status: 'success',
    });
  }

  revalidatePath('/dashboard/research');

  return {
    report: result.content,
    modelUsed,
    cost: result.cost,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    savedAssetId,
    frameworksUsed,
    webSources,
    searchQueries,
    groundingSupport,
    clientContext,
  };
}

/**
 * Save research to a specific client's content library
 */
export async function saveResearchToClient(
  report: string,
  topic: string,
  clientId: string,
  metadata: Record<string, unknown>
): Promise<{ id: string }> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('content_assets')
    .insert({
      client_id: clientId,
      title: `Research: ${topic.substring(0, 50)}${topic.length > 50 ? '...' : ''}`,
      asset_type: 'research_report',
      content_json: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: report }]
          }
        ]
      },
      metadata: {
        ...metadata,
        saved_manually: true,
        saved_at: new Date().toISOString(),
      }
    })
    .select('id')
    .single();

  if (error) {
    throw new Error('Failed to save research');
  }

  revalidatePath(`/dashboard/clients/${clientId}/content`);
  return { id: data.id };
}

/**
 * Get recent research sessions (migrated from ai_generations to ai_executions)
 */
export async function getRecentResearch(limit: number = 10) {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('ai_executions')
    .select(`
      id,
      input_data,
      output_data,
      input_tokens,
      output_tokens,
      total_cost_usd,
      created_at,
      client_id,
      clients(name),
      ai_models!inner(model_name, display_name)
    `)
    .eq('user_id', user.id)
    .eq('task_type', 'research')
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch research history:', error);
    return [];
  }

  return data?.map(item => {
    const inputData = item.input_data as { topic?: string } || {};
    const outputData = item.output_data as { report?: string } || {};
    const model = item.ai_models as { model_name?: string; display_name?: string } | null;
    
    return {
      id: item.id,
      topic: inputData.topic || 'Research',
      report: outputData.report || '',
      modelUsed: model?.display_name || model?.model_name || 'Unknown',
      tokens: (item.input_tokens || 0) + (item.output_tokens || 0),
      cost: item.total_cost_usd || 0,
      createdAt: item.created_at,
      clientId: item.client_id,
      clientName: (item.clients as { name?: string } | null)?.name || null,
    };
  }) || [];
}

// Helper functions for building prompts

function buildResearchSystemPrompt(depth: 'quick' | 'standard' | 'comprehensive'): string {
  const basePrompt = `You are an expert marketing research analyst. Your role is to provide comprehensive, actionable research insights that can be immediately applied to marketing campaigns.

Your research should:
1. Be well-structured with clear sections and headers
2. Include specific, actionable recommendations
3. Reference industry best practices and proven strategies
4. Consider the target audience and market context
5. Provide examples where relevant`;

  if (depth === 'comprehensive') {
    return `${basePrompt}

For comprehensive research, also include:
- Competitive analysis insights
- Market trend analysis
- Multiple strategic approaches
- Detailed implementation recommendations
- Risk considerations and mitigation strategies
- Success metrics and KPIs to track`;
  }

  if (depth === 'quick') {
    return `${basePrompt}

For quick research, focus on:
- Key insights only
- Top 3-5 actionable recommendations
- Brief, scannable format`;
  }

  return basePrompt;
}

function buildResearchUserPrompt(params: {
  topic: string;
  clientData: { name: string; intake_responses: unknown; brand_data: unknown } | null;
  frameworkContext: string;
  depth: 'quick' | 'standard' | 'comprehensive';
}): string {
  const { topic, clientData, frameworkContext, depth } = params;

  let prompt = `Research Topic: ${topic}\n\n`;

  if (clientData) {
    prompt += `=== CLIENT CONTEXT ===\n`;
    prompt += `Client: ${clientData.name}\n\n`;

    if (clientData.brand_data) {
      prompt += `Brand Information:\n${JSON.stringify(clientData.brand_data, null, 2)}\n\n`;
    }

    if (clientData.intake_responses) {
      prompt += `Client Background:\n${JSON.stringify(clientData.intake_responses, null, 2)}\n\n`;
    }
  }

  if (frameworkContext) {
    prompt += `=== RELEVANT MARKETING FRAMEWORKS ===\n`;
    prompt += `Use these proven frameworks to inform your research:\n\n`;
    prompt += frameworkContext;
    prompt += `\n\n`;
  }

  prompt += `=== RESEARCH REQUEST ===\n`;
  prompt += `Please provide ${depth === 'comprehensive' ? 'a comprehensive' : depth === 'quick' ? 'a quick' : 'an in-depth'} research report on the topic above.\n\n`;

  prompt += `Structure your response with clear markdown headings:\n`;
  prompt += `- ## Executive Summary\n`;
  prompt += `- ## Key Findings\n`;
  prompt += `- ## Strategic Recommendations\n`;
  
  if (depth !== 'quick') {
    prompt += `- ## Implementation Steps\n`;
    prompt += `- ## Metrics to Track\n`;
  }
  
  if (depth === 'comprehensive') {
    prompt += `- ## Competitive Considerations\n`;
    prompt += `- ## Risks and Mitigations\n`;
  }

  prompt += `\nMake your research actionable and specific to ${clientData ? `${clientData.name}'s` : 'the target'} needs.`;

  return prompt;
}

