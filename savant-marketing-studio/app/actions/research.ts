'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRelevantFrameworks, formatFrameworksForPrompt, getFrameworksByCategory } from '@/lib/ai/rag';
import { performWebResearch, WebSource } from '@/lib/ai/web-research';
import { extractClientContext, ClientContext } from '@/lib/client-context';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getModelIdFromName, getDefaultModelId } from '@/lib/ai/model-lookup';

/**
 * Safely convert a value to a string for prompt injection.
 * Handles objects, arrays, null, undefined.
 */
function stringifyForPrompt(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

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
  promptTemplateIds?: string[]; // NEW: Optional prompt templates from frameworks (supports multi-select)
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
 * Get available prompt templates for research
 * Returns frameworks with category 'prompt_template'
 */
export async function getResearchPromptTemplates(): Promise<{
  id: string;
  name: string;
  content: string;
}[]> {
  return await getFrameworksByCategory('prompt_template');
}

/**
 * Generate a research plan before execution (Gemini-style)
 * Now supports templates and client context for more targeted plans
 */
export async function generateResearchPlan(
  topic: string,
  mode: 'quick' | 'standard' | 'comprehensive',
  templateIds?: string[],
  clientId?: string
): Promise<{ items: string[]; estimatedTime: string; estimatedSources: string }> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Fetch selected templates if provided
  let templateContext = '';
  if (templateIds && templateIds.length > 0) {
    const allTemplates = await getFrameworksByCategory('prompt_template');
    const selectedTemplates = allTemplates.filter(t => templateIds.includes(t.id));
    
    if (selectedTemplates.length > 0) {
      templateContext = selectedTemplates
        .map(t => `### ${t.name}\n${t.content}`)
        .join('\n\n---\n\n');
    }
  }

  // Fetch client context if provided
  let clientContext = '';
  if (clientId) {
    const { data: client } = await supabase
      .from('clients')
      .select('name, intake_responses, brand_data')
      .eq('id', clientId)
      .single();
    
    if (client) {
      const intake = client.intake_responses as Record<string, any> || {};
      const brand = client.brand_data as Record<string, any> || {};
      
      // Build readable client context (not raw JSON dump)
      const contextParts = [
        `**Client:** ${client.name}`,
        intake.industry ? `**Industry:** ${intake.industry}` : null,
        intake.target_audience ? `**Target Audience:** ${intake.target_audience}` : null,
        intake.business_goals ? `**Business Goals:** ${intake.business_goals}` : null,
        brand.voice ? `**Brand Voice:** ${brand.voice}` : null,
        intake.unique_value_proposition ? `**Value Proposition:** ${intake.unique_value_proposition}` : null,
      ].filter(Boolean).join('\n');
      
      clientContext = contextParts;
    }
  }

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

  // Build enhanced prompt with context
  let planPrompt = `You are a research planning assistant. Create a focused research plan for this topic.

Topic: ${topic}
Research Mode: ${mode}
`;

  if (clientContext) {
    planPrompt += `
## Client Context
This research is for a specific client. Tailor the research plan to their needs:

${clientContext}
`;
  }

  if (templateContext) {
    planPrompt += `
## Research Templates to Follow
Structure the research according to these templates. Use them to inform what questions to research:

${templateContext}
`;
  }

  planPrompt += `
## Instructions
Generate EXACTLY ${modeConfig.itemCount} specific subtopics or angles to research. Each should be a complete sentence describing what you'll investigate.

${modeConfig.instruction}

Format your response as a numbered list:
1. [First subtopic]
2. [Second subtopic]
etc.

Be specific and actionable. Focus on what's most important for this topic${clientContext ? ' and this specific client' : ''}.`;

  // Use Gemini directly for plan generation (no Claude/orchestrator)
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const geminiResult = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: planPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  });

  const planText = geminiResult.response.text();

  // Parse the response into plan items
  const allLines = planText.split('\n').map(line => line.trim());
  
  const numberedLines = allLines.filter(line => /^\d+\./.test(line));
  
  const lines = numberedLines
    .map(line => line.replace(/^\d+\.\s*/, '')) // Remove numbers
    .map(line => line.replace(/\*\*/g, '').trim()); // Strip markdown bold markers

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
  const { topic, clientId, depth = 'standard', useWebSearch = true, promptTemplateIds } = params;

  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create mutable variable for web search decision (can be changed on fallback)
  let shouldUseWebSearch = useWebSearch;

  // PHASE 1: Get client data if specified
  let clientContext: ResearchResult['clientContext'];
  let clientData: { name: string; intake_responses: unknown; brand_data: unknown } | null = null;
  let clientContextForResearch: ClientContext | undefined;

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
      
      // Extract client context using proper nested field navigation
      // This correctly navigates intake_responses.sections.* structure
      clientContextForResearch = extractClientContext(
        client.name,
        client.intake_responses as Record<string, any> | null,
        client.brand_data as Record<string, any> | null
      );
    }
  }

  // PHASE 2: Search frameworks for relevant context (RAG)
  // Now uses getRelevantFrameworks() to get FULL framework content, not chunks
  let frameworkContext = '';
  const frameworksUsed: string[] = [];
  
  try {
    // Determine how many frameworks to fetch based on depth
    const frameworkCount = depth === 'comprehensive' ? 5 : depth === 'standard' ? 3 : 2;
    
    // Get FULL framework content (not chunks) using RAG search
    const relevantFrameworks = await getRelevantFrameworks(topic, 0.65, frameworkCount);
    
    if (relevantFrameworks.length > 0) {
      // Format with placeholders filled using client context
      // This replaces [DEMOGRAPHIC], [TARGET AUDIENCE], etc. with actual client data
      frameworkContext = formatFrameworksForPrompt(relevantFrameworks, clientContextForResearch);
      
      // Track which frameworks were used
      frameworksUsed.push(...relevantFrameworks.map(f => f.id));
    }
  } catch (error) {
    console.error('RAG search failed (continuing without framework context):', error);
  }

  // PHASE 2.5: Fetch and combine prompt templates if selected
  let promptTemplate: string | undefined;
  if (promptTemplateIds && promptTemplateIds.length > 0) {
    try {
      const allTemplates = await getFrameworksByCategory('prompt_template');
      const selectedTemplates = allTemplates.filter(t => promptTemplateIds.includes(t.id));
      
      if (selectedTemplates.length === 1) {
        // Single template - use as-is
        promptTemplate = selectedTemplates[0].content;
      } else if (selectedTemplates.length > 1) {
        // Multiple templates - combine with headers
        promptTemplate = `# Combined Research Framework\n\nThis research uses multiple templates:\n\n` +
          selectedTemplates
            .map(t => `## ${t.name}\n\n${t.content}`)
            .join('\n\n---\n\n');
      }
    } catch (error) {
      console.error('Failed to fetch prompt templates (continuing without):', error);
    }
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
      const webResult = await performWebResearch(
        topic, 
        depth, 
        clientContextForResearch,
        promptTemplate,      // NEW: template content
        frameworkContext     // NEW: RAG framework context (bug fix - was built but never passed!)
      );
      
      // Enhance web research with client context header if available
      let enhancedContent = webResult.content;
      if (clientData && clientContextForResearch) {
        const industryLine = clientContextForResearch.industry 
          ? `**Industry:** ${clientContextForResearch.industry}\n` 
          : '';
        const audienceLine = clientContextForResearch.targetAudience 
          ? `**Target Audience:** ${clientContextForResearch.targetAudience}\n` 
          : '';
        
        enhancedContent = `# Research Report: ${topic}
## Prepared for: ${clientData.name}
${industryLine}${audienceLine}
---

${webResult.content}`;
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
      const actualModel = depth === 'quick' 
        ? 'gemini-3-flash-preview' 
        : depth === 'standard'
          ? 'gemini-2.5-flash'
          : 'gemini-3-pro-preview';
      modelUsed = `${actualModel} (web-grounded)`;
      
      // Calculate cost based on actual model used
      // Gemini 3 Flash Preview: $0.50/$3.00 per 1M tokens (input/output)
      // Gemini 2.5 Flash: $0.30/$2.50 per 1M tokens (input/output)
      // Gemini 3 Pro Preview: $2.50/$10.00 per 1M tokens (input/output)
      const costPer1MInput = depth === 'quick' ? 0.50 : depth === 'standard' ? 0.30 : 2.50;
      const costPer1MOutput = depth === 'quick' ? 3.00 : depth === 'standard' ? 2.50 : 10.00;
      result.cost = (webResult.inputTokens / 1_000_000 * costPer1MInput) + 
                    (webResult.outputTokens / 1_000_000 * costPer1MOutput);
    } catch (webSearchError) {
      console.error('[Research] Gemini web research failed:', webSearchError);
      
      // Return error - do NOT fall back to Claude
      throw new Error(
        `Research failed: ${webSearchError instanceof Error ? webSearchError.message : 'Unknown error'}. Please try again.`
      );
    }
  } else {
    // Web search disabled - this should not happen in normal flow
    throw new Error('Web search is required for deep research. Please enable web search.');
  }

  // PHASE 5: Save to content_assets as research_report
  // Now auto-saves regardless of client (user_id always set)
  let savedAssetId: string | undefined;

  const { data: savedAsset, error: saveError } = await supabase
    .from('content_assets')
    .insert({
      client_id: clientId || null,
      user_id: user.id, // Always set user_id for ownership
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
    if (clientId) {
      revalidatePath(`/dashboard/clients/${clientId}/content`);
    }
  }

  // Log to ai_executions for analytics (migrated from ai_generations)
  // Links to content_asset if one was created, enabling cascade reassignment
  const modelId = await getModelIdFromName(modelUsed) || await getDefaultModelId();
  
  if (modelId) {
    await supabase.from('ai_executions').insert({
      user_id: user.id,
      client_id: clientId || null,
      model_id: modelId,
      task_type: 'research',
      complexity: depth === 'comprehensive' ? 'complex' : depth === 'standard' ? 'medium' : 'simple',
      content_asset_id: savedAssetId || null, // Link to created content for cascade reassignment
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
 * Save research to content library
 * This is used by the "Save to Library" button on the research page
 * Client is now OPTIONAL - research can be saved without a client
 */
export async function saveResearchToContent(data: {
  title: string;
  content: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  searchQueries?: string[];
  clientId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Client is optional - can save general research without a client
  const clientId = data.clientId || null;

  const { data: asset, error } = await supabase
    .from('content_assets')
    .insert({
      client_id: clientId,
      user_id: user.id, // Always set user_id for ownership
      title: data.title,
      asset_type: 'research_report',
      content_json: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: data.content }]
          }
        ]
      },
      metadata: {
        ...data.metadata,
        sources: data.sources,
        search_queries: data.searchQueries,
        saved_at: new Date().toISOString(),
        saved_manually: true,
        saved_by_user_id: user.id,
      }
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/dashboard/research');
  revalidatePath('/dashboard/content');
  if (clientId) {
    revalidatePath(`/dashboard/clients/${clientId}/content`);
  }
  return asset;
}

/**
 * Get research history from content_assets
 * Returns saved research reports for display in the history panel
 * Now includes BOTH client-specific research AND general research (no client)
 */
export async function getResearchHistory(limit: number = 20) {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get user's client IDs
  const { data: userClients } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id);

  const clientIds = userClients?.map(c => c.id) || [];

  // Query for research belonging to user's clients OR directly to user (no client)
  // Using OR filter to get both client-specific and general research
  let query = supabase
    .from('content_assets')
    .select(`
      id,
      title,
      content_json,
      metadata,
      created_at,
      client_id,
      user_id,
      clients(id, name)
    `)
    .eq('asset_type', 'research_report')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Build OR condition: user's research (user_id) OR client research (client_id in user's clients)
  if (clientIds.length > 0) {
    query = query.or(`user_id.eq.${user.id},client_id.in.(${clientIds.join(',')})`);
  } else {
    // User has no clients - only show their direct research
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch research history:', error);
    return [];
  }

  return data || [];
}

/**
 * Delete research from content library
 * Verifies ownership through user_id OR client ownership
 */
export async function deleteResearchFromContent(id: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user's client IDs for ownership verification
  const { data: userClients } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id);

  const clientIds = userClients?.map(c => c.id) || [];

  // Delete if user owns it directly (user_id) OR through client ownership
  // Build the filter: user_id matches OR client_id is in user's clients
  let query = supabase
    .from('content_assets')
    .delete()
    .eq('id', id)
    .eq('asset_type', 'research_report');

  if (clientIds.length > 0) {
    query = query.or(`user_id.eq.${user.id},client_id.in.(${clientIds.join(',')})`);
  } else {
    query = query.eq('user_id', user.id);
  }

  const { error } = await query;

  if (error) throw error;

  revalidatePath('/dashboard/research');
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
