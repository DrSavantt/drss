/**
 * REAL Web Research using Gemini's Google Search Grounding
 * This uses actual web search, not just AI training data
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClientContext } from '@/lib/client-context';

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

// ClientContext is imported from @/lib/client-context (single source of truth)
// Uses fields: name, industry, targetAudience, brandVoice, goals, uniqueValue, problems, solution, demographics

/**
 * Perform REAL web research using Gemini's grounding feature
 * This actually searches the web and cites sources
 * Now supports client context for personalized research
 * @param promptTemplate - Optional custom prompt template content
 * @param frameworkContext - Optional RAG framework context to inform analysis
 */
export async function performWebResearch(
  query: string,
  depth: 'quick' | 'standard' | 'comprehensive' = 'standard',
  clientContext?: ClientContext,
  promptTemplate?: string,
  frameworkContext?: string
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

  // Build research prompt based on depth (with optional client context, template, and framework context)
  const researchPrompt = buildResearchPrompt(query, depth, clientContext, promptTemplate, frameworkContext);

  try {
    // googleSearch tool enables real web search (formerly googleSearchRetrieval)
    
    // Enable thinking mode for comprehensive research only
    // Note: thinkingConfig is not in SDK types yet, using type assertion
    const useThinking = depth === 'comprehensive';
    
    // Build generation config with optional thinking mode
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: maxTokens,
      // Add thinking for comprehensive mode (Gemini 3 Pro)
      // thinkingBudget: -1 means dynamic/automatic thinking
      ...(useThinking && {
        thinkingConfig: {
          thinkingBudget: -1,  // -1 = dynamic, 0 = disable, or specific token count
        }
      })
    };
    
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
        generationConfig: generationConfig as any,  // Type assertion for thinkingConfig
      });
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
 * @param promptTemplate - Optional custom prompt template (replaces default structure)
 * @param frameworkContext - Optional RAG framework context to inform analysis
 */
function buildResearchPrompt(
  query: string, 
  depth: 'quick' | 'standard' | 'comprehensive',
  clientContext?: ClientContext,
  promptTemplate?: string,
  frameworkContext?: string
): string {
  // If custom template provided, use it as the base
  if (promptTemplate) {
    let prompt = promptTemplate;
    
    // Replace placeholder variables if they exist in template
    prompt = prompt.replace(/\{topic\}/gi, query);
    prompt = prompt.replace(/\{query\}/gi, query);
    
    // Add client context if available
    if (clientContext) {
      const contextLines = [
        `Business Name: ${clientContext.name}`,
        clientContext.industry ? `Industry: ${clientContext.industry}` : null,
        clientContext.targetAudience ? `Target Audience: ${clientContext.targetAudience}` : null,
        clientContext.demographics ? `Demographics: ${clientContext.demographics}` : null,
        clientContext.brandVoice ? `Brand Voice/Tone: ${clientContext.brandVoice}` : null,
        clientContext.goals ? `Business Goals: ${clientContext.goals}` : null,
        clientContext.problems ? `Problems They Solve: ${clientContext.problems}` : null,
        clientContext.solution ? `Solution/Methodology: ${clientContext.solution}` : null,
        clientContext.uniqueValue ? `Unique Value: ${clientContext.uniqueValue}` : null,
      ].filter(Boolean).join('\n');
      
      prompt += `\n\n## Client Context\n${contextLines}`;
    }
    
    // Add framework context if available
    if (frameworkContext) {
      prompt += `\n\n## Relevant Marketing Frameworks\nUse these frameworks to inform your analysis:\n${frameworkContext}`;
    }
    
    return prompt;
  }
  
  // Original logic for when no template provided
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
      clientContext.demographics ? `Demographics: ${clientContext.demographics}` : null,
      clientContext.brandVoice ? `Brand Voice/Tone: ${clientContext.brandVoice}` : null,
      clientContext.goals ? `Business Goals: ${clientContext.goals}` : null,
      clientContext.problems ? `Problems They Solve: ${clientContext.problems}` : null,
      clientContext.solution ? `Solution/Methodology: ${clientContext.solution}` : null,
      clientContext.uniqueValue ? `Unique Value: ${clientContext.uniqueValue}` : null,
    ].filter(Boolean).join('\n');

    clientSection = `
## CLIENT CONTEXT - Tailor this research for:
${contextLines}

IMPORTANT: Frame all findings, recommendations, and strategies specifically for this client's business context, industry, and target audience. Make the research actionable for their specific situation.
`;
  }

  // Build the default prompt
  let prompt = `
# Research Topic: ${query}

${depthInstructions[depth]}
${clientSection}
Please search for current, reliable information and provide a well-researched report. 
Cite your sources with [Source Name](URL) format throughout the response.
Focus on recent information (last 2 years) when possible.
`;

  // Add framework context if available (for default prompts too)
  if (frameworkContext) {
    prompt += `\n\n## Relevant Marketing Frameworks\nUse these frameworks to inform your analysis:\n${frameworkContext}`;
  }

  return prompt;
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

