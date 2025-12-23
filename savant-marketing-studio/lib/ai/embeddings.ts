/**
 * Generate embeddings using OpenAI's text-embedding-3-small model
 * This is used for RAG (Retrieval Augmented Generation)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured, embeddings disabled');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI embedding error:', error);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured, embeddings disabled');
    return texts.map(() => null);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI embedding error:', error);
      return texts.map(() => null);
    }

    const data = await response.json();
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  } catch (error) {
    console.error('Failed to generate embeddings:', error);
    return texts.map(() => null);
  }
}

