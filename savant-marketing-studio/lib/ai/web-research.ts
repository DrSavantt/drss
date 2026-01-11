/**
 * REAL Web Research using Gemini's Google Search Grounding
 * This uses actual web search, not just AI training data
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface WebSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface WebResearchResult {
  content: string;
  sources: WebSource[];
  searchQueries: string[];
  inputTokens: number;
  outputTokens: number;
  groundingSupport?: number; // How much of the response is grounded in search results (0-1)
}

/**
 * Client context for personalized research
 * Extracted from client's intake_responses and brand_data
 */
export interface ClientContext {
  name: string;
  industry?: string;
  targetAudience?: string;
  brandVoice?: string;
  goals?: string;
  additionalContext?: string;
}

/**
 * Perform REAL web research using Gemini's grounding feature
 * This actually searches the web and cites sources
 * Now supports client context for personalized research
 */
export async function performWebResearch(
  query: string,
  depth: 'quick' | 'standard' | 'comprehensive' = 'standard',
  clientContext?: ClientContext
): Promise<WebResearchResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured - cannot perform web research');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Model selection based on depth - using latest Gemini 3 models
  const getModelForDepth = (d: 'quick' | 'standard' | 'comprehensive'): string => {
    switch (d) {
      case 'quick':
        return 'gemini-3-flash-preview';
      case 'standard':
        return 'gemini-2.5-flash';
      case 'comprehensive':
        return 'gemini-3-pro-preview';
      default:
        return 'gemini-3-flash-preview';
    }
  };

  const getMaxTokensForDepth = (d: 'quick' | 'standard' | 'comprehensive'): number => {
    switch (d) {
      case 'quick':
        return 2048;
      case 'standard':
        return 4096;
      case 'comprehensive':
        return 8192;
      default:
        return 2048;
    }
  };
  
  const modelName = getModelForDepth(depth);
  const maxTokens = getMaxTokensForDepth(depth);
  
  const model = genAI.getGenerativeModel({ 
    model: modelName,
  });

  // Build research prompt based on depth (with optional client context)
  const researchPrompt = buildResearchPrompt(query, depth, clientContext);

  // DEBUG LOGGING
  console.log('[WebResearch] Starting research with:', {
    topic: query,
    depth,
    model: modelName,
    hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
    apiKeyPrefix: process.env.GOOGLE_AI_API_KEY?.substring(0, 10) + '...'
  });

  try {
    // THIS IS THE KEY: googleSearch tool enables real web search (formerly googleSearchRetrieval)
    console.log('[WebResearch] About to call Gemini generateContent...');
    
    let result;
    try {
      result = await model.generateContent({
        contents: [{ 
          role: 'user', 
          parts: [{ text: researchPrompt }] 
        }],
        tools: [{
          googleSearch: {}
        }] as any,  // Type assertion - SDK types don't include googleSearch yet
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens,
        }
      });
      console.log('[WebResearch] Gemini response received successfully');
    } catch (geminiError) {
      console.error('[WebResearch] Gemini API call FAILED:', {
        error: geminiError,
        message: geminiError instanceof Error ? geminiError.message : 'Unknown',
        stack: geminiError instanceof Error ? geminiError.stack : undefined,
        name: geminiError instanceof Error ? geminiError.name : undefined
      });
      throw geminiError; // Re-throw to trigger outer catch
    }

    const response = result.response;
    const text = response.text();
    
    // Extract grounding metadata - THIS PROVES IT SEARCHED THE WEB
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    
    // Extract sources from grounding chunks
    const sources: WebSource[] = [];
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || 'Untitled',
            url: chunk.web.uri || '',
            // Note: snippet not available in current SDK version
          });
        }
      }
    }

    // Extract search queries that were actually performed
    const searchQueries = groundingMetadata?.webSearchQueries || [];
    
    // Grounding support score (how much of response is backed by sources)
    const groundingSupport = groundingMetadata?.retrievalMetadata?.googleSearchDynamicRetrievalScore;

    // Get token counts
    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;

    return {
      content: text,
      sources: deduplicateSources(sources),
      searchQueries,
      inputTokens,
      outputTokens,
      groundingSupport,
    };
  } catch (error) {
    console.error('Web research error:', error);
    throw new Error(`Web research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build research prompt based on depth, with optional client context for personalization
 */
function buildResearchPrompt(
  query: string, 
  depth: 'quick' | 'standard' | 'comprehensive',
  clientContext?: ClientContext
): string {
  const depthInstructions = {
    quick: `
Provide a concise overview with:
- Key points (3-5 bullet points)
- One practical recommendation
- Brief summary
`,
    standard: `
Provide comprehensive research with:
1. Executive Summary
2. Key Findings (with data/statistics if available)
3. Different Perspectives or Approaches
4. Practical Applications
5. Recommendations

Cite sources throughout your response. Be thorough but focused.
`,
    comprehensive: `
Conduct exhaustive research covering:
1. Executive Summary
2. Current State / Background
3. Key Findings & Data
   - Include statistics, studies, expert opinions
   - Cover multiple perspectives
4. Case Studies or Real-World Examples
5. Comparative Analysis (different approaches/methods)
6. Challenges & Limitations
7. Best Practices & Recommendations
8. Future Outlook / Trends
9. Actionable Next Steps

Cite all sources. Be extremely thorough. Include counterarguments where relevant.
`
  };

  // Build client context section if available
  let clientSection = '';
  if (clientContext) {
    const contextLines = [
      `Business Name: ${clientContext.name}`,
      clientContext.industry ? `Industry: ${clientContext.industry}` : null,
      clientContext.targetAudience ? `Target Audience: ${clientContext.targetAudience}` : null,
      clientContext.brandVoice ? `Brand Voice/Tone: ${clientContext.brandVoice}` : null,
      clientContext.goals ? `Business Goals: ${clientContext.goals}` : null,
      clientContext.additionalContext ? `Additional Context: ${clientContext.additionalContext}` : null,
    ].filter(Boolean).join('\n');

    clientSection = `
## CLIENT CONTEXT - Tailor this research for:
${contextLines}

IMPORTANT: Frame all findings, recommendations, and strategies specifically for this client's business context, industry, and target audience. Make the research actionable for their specific situation.
`;
  }

  return `
# Research Topic: ${query}

${depthInstructions[depth]}
${clientSection}
Please search for current, reliable information and provide a well-researched report. 
Cite your sources with [Source Name](URL) format throughout the response.
Focus on recent information (last 2 years) when possible.
`;
}

/**
 * Remove duplicate sources (same URL)
 */
function deduplicateSources(sources: WebSource[]): WebSource[] {
  const seen = new Set<string>();
  const unique: WebSource[] = [];
  
  for (const source of sources) {
    if (!seen.has(source.url)) {
      seen.add(source.url);
      unique.push(source);
    }
  }
  
  return unique;
}

/**
 * Format sources as markdown list
 */
export function formatSourcesList(sources: WebSource[]): string {
  if (sources.length === 0) {
    return 'No sources cited.';
  }
  
  return sources
    .map((source, i) => `${i + 1}. [${source.title}](${source.url})`)
    .join('\n');
}

