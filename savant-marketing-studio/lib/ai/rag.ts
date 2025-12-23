import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from './embeddings';

interface FrameworkChunk {
  id: number;
  framework_id: string;
  content: string;
  similarity: number;
}

/**
 * Search marketing frameworks using vector similarity
 * Returns relevant framework chunks based on semantic similarity to query
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
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
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
        metadata: { name, category },
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

