'use server';

import { AIOrchestrator, TaskComplexity } from '@/lib/ai/orchestrator';
import { searchFrameworks } from '@/lib/ai/rag';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
}

export interface ResearchResult {
  report: string;
  modelUsed: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  savedAssetId?: string;
  frameworksUsed: string[];
  clientContext?: {
    name: string;
    hasIntakeData: boolean;
    hasBrandData: boolean;
  };
}

/**
 * Perform deep research on a topic using AI, frameworks, and optionally client context
 */
export async function performDeepResearch(params: ResearchParams): Promise<ResearchResult> {
  const { topic, clientId, depth = 'standard' } = params;

  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

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

  // PHASE 3: Build comprehensive research prompt
  const complexity: TaskComplexity = depth === 'comprehensive' ? 'complex' : depth === 'standard' ? 'medium' : 'simple';

  const systemPrompt = buildResearchSystemPrompt(depth);
  const userPrompt = buildResearchUserPrompt({
    topic,
    clientData,
    frameworkContext,
    depth,
  });

  // PHASE 4: Execute AI research
  const orchestrator = new AIOrchestrator();
  const result = await orchestrator.executeTask({
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
          model_used: result.modelUsed,
          cost_usd: result.cost,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          frameworks_used: frameworksUsed,
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

  // Also log to ai_generations for analytics
  await supabase.from('ai_generations').insert({
    user_id: user.id,
    client_id: clientId || null,
    generation_type: 'research',
    model_used: result.modelUsed,
    prompt: topic,
    output_data: { report: result.content },
    tokens_used: result.inputTokens + result.outputTokens,
    cost_estimate: result.cost,
    context_used: {
      frameworks_count: frameworksUsed.length,
      had_client_data: !!clientData,
      depth,
    },
  });

  revalidatePath('/dashboard/research');

  return {
    report: result.content,
    modelUsed: result.modelUsed,
    cost: result.cost,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    savedAssetId,
    frameworksUsed,
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
 * Get recent research sessions
 */
export async function getRecentResearch(limit: number = 10) {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('ai_generations')
    .select(`
      id,
      prompt,
      output_data,
      model_used,
      tokens_used,
      cost_estimate,
      created_at,
      client_id,
      clients(name)
    `)
    .eq('user_id', user.id)
    .eq('generation_type', 'research')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch research history:', error);
    return [];
  }

  return data?.map(item => ({
    id: item.id,
    topic: item.prompt,
    report: (item.output_data as { report?: string })?.report || '',
    modelUsed: item.model_used,
    tokens: item.tokens_used || 0,
    cost: item.cost_estimate || 0,
    createdAt: item.created_at,
    clientId: item.client_id,
    clientName: (item.clients as { name?: string } | null)?.name || null,
  })) || [];
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

