/**
 * Generate embeddings using Google Gemini's gemini-embedding-001 model
 * This is used for RAG (Retrieval Augmented Generation)
 * 
 * Model: gemini-embedding-001
 * Dimensions: 2000 (native 3072, reduced for pgvector index limit)
 * Max input: 2048 tokens
 */
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

// Embedding configuration
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 2000; // gemini-embedding-001 supports up to 3072, using 2000 for pgvector

/**
 * Generate a single embedding for text
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.warn('GOOGLE_AI_API_KEY not configured, embeddings disabled');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });
    
    return result.embedding.values;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Generate embedding optimized for search queries
 * Uses RETRIEVAL_QUERY task type for better search performance
 */
export async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.warn('GOOGLE_AI_API_KEY not configured, embeddings disabled');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      taskType: TaskType.RETRIEVAL_QUERY,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });
    
    return result.embedding.values;
  } catch (error) {
    console.error('Failed to generate query embedding:', error);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * Note: Gemini SDK doesn't have native batch embedding, so we process sequentially
 * with a small delay to avoid rate limiting
 */
export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.warn('GOOGLE_AI_API_KEY not configured, embeddings disabled');
    return texts.map(() => null);
  }

  const results: (number[] | null)[] = [];
  
  for (let i = 0; i < texts.length; i++) {
    const embedding = await generateEmbedding(texts[i]);
    results.push(embedding);
    
    // Small delay between requests to avoid rate limiting
    if (i < texts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  return results;
}

/**
 * Get the embedding dimension size
 * Useful for verification and debugging
 */
export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS;
}

/**
 * Get the embedding model name
 */
export function getEmbeddingModel(): string {
  return EMBEDDING_MODEL;
}
