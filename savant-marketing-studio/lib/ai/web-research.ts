/**
 * REAL Web Research using Gemini's Google Search Grounding
 * This uses actual web search, not just AI training data
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

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
 * Perform REAL web research using Gemini's grounding feature
 * This actually searches the web and cites sources
 */
export async function performWebResearch(
  query: string,
  depth: 'quick' | 'standard' | 'comprehensive' = 'standard'
): Promise<WebResearchResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured - cannot perform web research');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Select model based on depth
  // Flash for quick research (faster, cheaper)
  // Pro for standard and comprehensive (better quality, more sources)
  const modelName = depth === 'quick' ? 'gemini-1.5-flash' : 'gemini-1.5-pro';
  
  const model = genAI.getGenerativeModel({ 
    model: modelName,
  });

  // Build research prompt based on depth
  const researchPrompt = buildResearchPrompt(query, depth);

  // Set dynamic threshold based on depth
  // Lower threshold = more search results used = deeper research
  const dynamicThreshold = 
    depth === 'comprehensive' ? 0.1 :  // Very low = use lots of search results
    depth === 'standard' ? 0.3 :       // Medium = balanced
    0.5;                                // High = only use most relevant results

  try {
    // THIS IS THE KEY: googleSearchRetrieval tool enables real web search
    const result = await model.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ text: researchPrompt }] 
      }],
      tools: [{
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: 'MODE_DYNAMIC',
            dynamicThreshold,
          }
        }
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: depth === 'comprehensive' ? 8192 : 
                        depth === 'standard' ? 4096 : 
                        2048,
      }
    });

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
            snippet: chunk.web.snippet,
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
 * Build research prompt based on depth
 */
function buildResearchPrompt(query: string, depth: 'quick' | 'standard' | 'comprehensive'): string {
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

  return `
# Research Topic: ${query}

${depthInstructions[depth]}

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

