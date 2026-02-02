import { createClient } from '@/lib/supabase/server';
import { generateEmbedding, generateQueryEmbedding } from './embeddings';
import { ClientContext } from '@/lib/client-context';

interface FrameworkChunk {
  id: number;
  framework_id: string;
  content: string;
  similarity: number;
}

/**
 * Search marketing frameworks using vector similarity
 * Returns relevant framework chunks based on semantic similarity to query
 * Uses Gemini gemini-embedding-001 with RETRIEVAL_QUERY task type for optimal search
 */
export async function searchFrameworks(
  query: string,
  threshold: number = 0.7,
  limit: number = 5
): Promise<FrameworkChunk[]> {
  const supabase = await createClient();
  if (!supabase) {
    console.warn('Supabase not configured, skipping RAG search');
    return [];
  }

  try {
    // Generate embedding for query (uses query-optimized task type)
    const queryEmbedding = await generateQueryEmbedding(query);
    
    if (!queryEmbedding) {
      console.warn('Could not generate embedding for query');
      return [];
    }

    // Search for similar chunks using the database function
    const { data, error } = await supabase.rpc('match_framework_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error('RAG search error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('RAG search failed:', error);
    return [];
  }
}

// ============================================================================
// FRAMEWORK RETRIEVAL & PLACEHOLDER FUNCTIONS
// ============================================================================

/**
 * Full framework with relevance scoring from RAG search
 */
export interface RelevantFramework {
  id: string;
  name: string;
  content: string;        // FULL content from marketing_frameworks
  category: string | null;
  relevanceScore: number; // highest similarity score from matching chunks
}

// ClientContext is imported from @/lib/client-context (single source of truth)

/**
 * Get relevant frameworks with FULL content using RAG search
 * 
 * Uses searchFrameworks() to find matching chunks, then fetches complete
 * framework content from marketing_frameworks table.
 * 
 * @param query - Search query for semantic matching
 * @param threshold - Minimum similarity threshold (default 0.65)
 * @param maxFrameworks - Maximum number of frameworks to return (default 3)
 * @returns Array of complete frameworks sorted by relevance
 */
export async function getRelevantFrameworks(
  query: string,
  threshold: number = 0.65,
  maxFrameworks: number = 3
): Promise<RelevantFramework[]> {
  // Search for more chunks than needed to ensure we get enough unique frameworks
  const chunkLimit = maxFrameworks * 3;
  const chunks = await searchFrameworks(query, threshold, chunkLimit);
  
  if (chunks.length === 0) {
    return [];
  }

  // Group chunks by framework_id and keep highest similarity score
  const frameworkScores = new Map<string, number>();
  
  for (const chunk of chunks) {
    const currentScore = frameworkScores.get(chunk.framework_id) || 0;
    if (chunk.similarity > currentScore) {
      frameworkScores.set(chunk.framework_id, chunk.similarity);
    }
  }

  // Sort by relevance score and take top N
  const sortedFrameworkIds = Array.from(frameworkScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxFrameworks)
    .map(([id, score]) => ({ id, score }));

  if (sortedFrameworkIds.length === 0) {
    return [];
  }

  // Fetch full content from marketing_frameworks table
  const supabase = await createClient();
  if (!supabase) {
    console.warn('[RAG] Supabase not configured, cannot fetch full frameworks');
    return [];
  }

  const frameworkIds = sortedFrameworkIds.map(f => f.id);
  
  const { data: frameworks, error } = await supabase
    .from('marketing_frameworks')
    .select('id, name, content, category')
    .in('id', frameworkIds)
    .is('deleted_at', null);

  if (error) {
    console.error('[RAG] Error fetching full frameworks:', error);
    return [];
  }

  if (!frameworks || frameworks.length === 0) {
    console.warn('[RAG] No frameworks found for IDs:', frameworkIds);
    return [];
  }

  // Create a map for quick lookup
  const frameworkMap = new Map(frameworks.map(f => [f.id, f]));

  // Build result array preserving relevance order
  const results: RelevantFramework[] = [];
  
  for (const { id, score } of sortedFrameworkIds) {
    const framework = frameworkMap.get(id);
    if (framework) {
      results.push({
        id: framework.id,
        name: framework.name,
        content: framework.content,
        category: framework.category,
        relevanceScore: score,
      });
    }
  }

  return results;
}

/**
 * Replace common placeholders in framework content with client data
 * 
 * Handles various placeholder formats like [DEMOGRAPHIC], [TARGET AUDIENCE], etc.
 * Uses case-insensitive matching and provides sensible defaults.
 * 
 * @param content - Framework content with placeholders
 * @param context - Client context data for replacement
 * @returns Content with placeholders filled in
 */
export function fillFrameworkPlaceholders(
  content: string,
  context: ClientContext
): string {
  let result = content;

  // Define placeholder mappings: [pattern variations] => replacement value
  const replacements: Array<{
    patterns: RegExp[];
    getValue: () => string;
  }> = [
    {
      patterns: [
        /\[DEMOGRAPHIC\]/gi,
        /\[DEMOGRAPHICS\]/gi,
      ],
      getValue: () => context.demographics || context.targetAudience || "your target audience",
    },
    {
      patterns: [
        /\[TARGET AUDIENCE\]/gi,
        /\[TARGET_AUDIENCE\]/gi,
        /\[AUDIENCE\]/gi,
      ],
      getValue: () => context.targetAudience || "your ideal customers",
    },
    {
      patterns: [
        /\[INDUSTRY\]/gi,
      ],
      getValue: () => context.industry || "your industry",
    },
    {
      patterns: [
        /\[BRAND\]/gi,
        /\[BRAND NAME\]/gi,
        /\[BRAND_NAME\]/gi,
        /\[COMPANY\]/gi,
      ],
      getValue: () => context.name || "your brand",
    },
    {
      patterns: [
        /\[PRODUCT\]/gi,
        /\[PRODUCT TYPE\]/gi,
        /\[PRODUCT_TYPE\]/gi,
        /\[SERVICE\]/gi,
      ],
      getValue: () => context.industry || "your product/service",
    },
    {
      patterns: [
        /\[VOICE\]/gi,
        /\[BRAND VOICE\]/gi,
        /\[BRAND_VOICE\]/gi,
        /\[TONE\]/gi,
      ],
      getValue: () => context.brandVoice || "your brand voice",
    },
    {
      patterns: [
        /\[GOAL\]/gi,
        /\[GOALS\]/gi,
        /\[OBJECTIVE\]/gi,
        /\[OBJECTIVES\]/gi,
      ],
      getValue: () => context.goals || "your goals",
    },
    {
      patterns: [
        /\[PROBLEM\]/gi,
        /\[PROBLEMS\]/gi,
        /\[PAIN POINT\]/gi,
        /\[PAIN_POINT\]/gi,
        /\[PAIN POINTS\]/gi,
        /\[PAIN_POINTS\]/gi,
      ],
      getValue: () => context.problems || "their problems",
    },
    {
      patterns: [
        /\[SOLUTION\]/gi,
        /\[METHODOLOGY\]/gi,
      ],
      getValue: () => context.solution || "your solution",
    },
    {
      patterns: [
        /\[USP\]/gi,
        /\[UNIQUE VALUE\]/gi,
        /\[UNIQUE_VALUE\]/gi,
        /\[DIFFERENTIATOR\]/gi,
        /\[VALUE PROP\]/gi,
        /\[VALUE_PROP\]/gi,
      ],
      getValue: () => context.uniqueValue || "your unique value",
    },
    // Additional common placeholders
    {
      patterns: [
        /\[CUSTOMERS?\]/gi,  // [CUSTOMER] or [CUSTOMERS]
      ],
      getValue: () => context.targetAudience || "your customers",
    },
    {
      patterns: [
        /\[REGION\]/gi,
        /\[LOCATION\]/gi,
        /\[AREA\]/gi,
      ],
      getValue: () => context.demographics || "your region",
    },
    {
      patterns: [
        /\[NICHE\]/gi,
      ],
      getValue: () => context.industry || "your niche",
    },
    {
      patterns: [
        /\[MARKET\]/gi,
      ],
      getValue: () => context.industry || "your market",
    },
    {
      patterns: [
        /\[PRODUCT\/SERVICE\]/gi,  // With slash
        /\[PRODUCT OR SERVICE\]/gi,
      ],
      getValue: () => context.industry || "your product/service",
    },
  ];

  // Apply all replacements
  for (const { patterns, getValue } of replacements) {
    const value = getValue();
    for (const pattern of patterns) {
      result = result.replace(pattern, value);
    }
  }

  return result;
}

/**
 * Format frameworks into a clean markdown string for AI prompts
 * 
 * @param frameworks - Array of relevant frameworks
 * @param context - Optional client context for placeholder replacement
 * @returns Formatted markdown string ready for prompt injection
 */
export function formatFrameworksForPrompt(
  frameworks: RelevantFramework[],
  context?: ClientContext
): string {
  if (!frameworks || frameworks.length === 0) {
    return '';
  }

  const formattedFrameworks = frameworks.map(framework => {
    // Apply placeholder replacement if context provided
    let content = framework.content;
    if (context) {
      content = fillFrameworkPlaceholders(content, context);
    }

    // Build framework section
    let section = `### ${framework.name}`;
    
    if (framework.category) {
      section += `\n*Category: ${framework.category}*`;
    }
    
    section += `\n\n${content}`;
    
    return section;
  });

  // Join with separator (header added by caller in web-research.ts)
  const body = formattedFrameworks.join('\n\n---\n\n');
  
  return body;
}

// ============================================================================
// CATEGORY-BASED RETRIEVAL
// ============================================================================

/**
 * Framework purpose types for category filtering
 * - research: Strategy and persuasion frameworks for research/analysis
 * - content_generation: Copywriting formulas and templates for content creation
 * - all: No filtering, return all relevant frameworks
 */
export type FrameworkPurpose = 'research' | 'content_generation' | 'all';

/**
 * Category mapping for framework purposes
 * Maps each purpose to the relevant framework categories
 */
const CATEGORY_MAP: Record<FrameworkPurpose, string[] | null> = {
  research: ['strategy_framework', 'persuasion'],
  content_generation: ['copywriting_formula', 'structure_template', 'prompt_template', 'email', 'social', 'story_framework'],
  all: null // No filter - return all categories
};

/**
 * Unified framework context retrieval with category filtering
 * 
 * This is the main entry point for getting framework context in AI features.
 * It combines:
 * 1. Semantic search via getRelevantFrameworks()
 * 2. Category filtering based on purpose
 * 3. Placeholder replacement via formatFrameworksForPrompt()
 * 
 * @param query - Search query for semantic matching
 * @param options - Configuration options
 * @param options.purpose - Framework purpose filter ('research' | 'content_generation' | 'all')
 * @param options.clientContext - Optional client context for placeholder replacement
 * @param options.maxFrameworks - Maximum frameworks to return (default: 5)
 * @param options.threshold - Similarity threshold (default: 0.6)
 * @returns Object with formatted context string and array of framework IDs used
 * 
 * @example
 * const { context, frameworkIds } = await getFrameworkContext(
 *   "write a compelling email",
 *   { purpose: 'content_generation', clientContext: myClient, maxFrameworks: 5 }
 * );
 */
export async function getFrameworkContext(
  query: string,
  options: {
    purpose: FrameworkPurpose;
    clientContext?: ClientContext;
    maxFrameworks?: number;
    threshold?: number;
  }
): Promise<{ context: string; frameworkIds: string[] }> {
  const { 
    purpose, 
    clientContext, 
    maxFrameworks = 5, 
    threshold = 0.6 
  } = options;

  // Get the allowed categories for this purpose
  const allowedCategories = CATEGORY_MAP[purpose];

  try {
    // Fetch more frameworks than needed to account for category filtering
    // If filtering by category, get 2x the max to ensure enough after filtering
    const fetchLimit = allowedCategories ? maxFrameworks * 2 : maxFrameworks;
    
    const frameworks = await getRelevantFrameworks(query, threshold, fetchLimit);

    if (frameworks.length === 0) {
      return { context: '', frameworkIds: [] };
    }

    // Filter by category if purpose requires it
    let filteredFrameworks = frameworks;
    if (allowedCategories !== null) {
      filteredFrameworks = frameworks.filter(
        f => f.category && allowedCategories.includes(f.category)
      );
    }

    // Limit to maxFrameworks after filtering
    filteredFrameworks = filteredFrameworks.slice(0, maxFrameworks);

    if (filteredFrameworks.length === 0) {
      return { context: '', frameworkIds: [] };
    }

    // Extract framework IDs for tracking
    const frameworkIds = filteredFrameworks.map(f => f.id);

    // Format frameworks with optional client context for placeholder replacement
    const formattedContent = formatFrameworksForPrompt(filteredFrameworks, clientContext);

    // Build the full context block
    const context = formattedContent 
      ? `## Relevant Marketing Frameworks\n\nUse these proven frameworks to inform your response:\n\n${formattedContent}\n\n---\n\n`
      : '';

    return { context, frameworkIds };
  } catch (error) {
    console.error('[RAG] getFrameworkContext failed:', error);
    return { context: '', frameworkIds: [] };
  }
}

/**
 * Get frameworks by category (non-RAG simple query)
 */
export async function getFrameworksByCategory(category: string): Promise<{ id: string; name: string; content: string }[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('marketing_frameworks')
    .select('id, name, content')
    .eq('category', category)
    .is('deleted_at', null)  // Exclude soft-deleted frameworks
    .limit(10);

  if (error) {
    console.error('Error fetching frameworks:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a new marketing framework with automatic chunking and embedding
 */
export async function addFramework(
  name: string,
  category: string,
  content: string,
  description?: string,
  isPublic: boolean = false
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'User not authenticated' };

  try {
    // Create the framework
    const { data: framework, error: frameworkError } = await supabase
      .from('marketing_frameworks')
      .insert({
        user_id: user.id,
        name,
        category,
        content,
        description,
        is_public: isPublic,
      })
      .select('id')
      .single();

    if (frameworkError) {
      return { success: false, error: frameworkError.message };
    }

    // Chunk the content (simple paragraph-based chunking)
    const chunks = chunkText(content);

    // Generate embeddings and insert chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);

      await supabase.from('framework_chunks').insert({
        framework_id: framework.id,
        content: chunk,
        chunk_index: i,
        embedding,
      });
    }

    return { success: true, id: framework.id };
  } catch (error) {
    console.error('Error adding framework:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Simple text chunking - splits by paragraphs with overlap
 */
function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Keep overlap from previous chunk
        currentChunk = currentChunk.slice(-overlap) + '\n\n' + paragraph;
      } else {
        // Paragraph is too long, split by sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

