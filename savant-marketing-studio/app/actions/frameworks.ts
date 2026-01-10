'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateEmbedding } from '@/lib/ai/embeddings';

export interface Framework {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Get all frameworks for current user (excluding soft-deleted)
export async function getFrameworks(): Promise<Framework[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('marketing_frameworks')
    .select('*')
    .is('deleted_at', null)  // Exclude soft-deleted frameworks
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch frameworks:', error);
    return [];
  }

  return data || [];
}

// Get single framework (excluding soft-deleted)
export async function getFramework(id: string): Promise<Framework | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('marketing_frameworks')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)  // Exclude soft-deleted frameworks
    .single();

  if (error) {
    console.error('Failed to fetch framework:', error);
    return null;
  }

  return data;
}

// Create framework + generate embeddings
export async function createFramework(formData: FormData): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database not configured' };
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const content = formData.get('content') as string;

  if (!name || !content) {
    return { error: 'Name and content are required' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Create framework
  const { data: framework, error } = await supabase
    .from('marketing_frameworks')
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      category: category || null,
      content,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create framework:', error);
    return { error: 'Failed to create framework' };
  }

  // Generate embeddings in background (don't block)
  generateFrameworkEmbeddings(framework.id, content).catch(err => {
    console.error('Failed to generate embeddings:', err);
  });

  revalidatePath('/dashboard/frameworks');
  return { id: framework.id };
}

// Update framework + regenerate embeddings
export async function updateFramework(id: string, formData: FormData): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database not configured' };
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const content = formData.get('content') as string;

  if (!name || !content) {
    return { error: 'Name and content are required' };
  }

  // Update framework
  const { error } = await supabase
    .from('marketing_frameworks')
    .update({
      name,
      description: description || null,
      category: category || null,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Failed to update framework:', error);
    return { error: 'Failed to update framework' };
  }

  // Delete old embeddings and regenerate
  await supabase.from('framework_chunks').delete().eq('framework_id', id);
  generateFrameworkEmbeddings(id, content).catch(err => {
    console.error('Failed to regenerate embeddings:', err);
  });

  revalidatePath('/dashboard/frameworks');
  revalidatePath(`/dashboard/frameworks/${id}`);
  return { success: true };
}

// Delete framework (soft delete - embeddings preserved for restore)
export async function deleteFramework(id: string): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database not configured' };

  // Soft delete instead of hard delete
  const { error } = await supabase
    .from('marketing_frameworks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Failed to delete framework:', error);
    return { error: 'Failed to delete framework' };
  }

  revalidatePath('/dashboard/frameworks');
  revalidatePath('/dashboard/archive');
  return { success: true };
}

// Restore framework from soft delete
export async function restoreFramework(id: string): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database not configured' };

  const { error } = await supabase
    .from('marketing_frameworks')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) {
    console.error('Failed to restore framework:', error);
    return { error: 'Failed to restore framework' };
  }

  revalidatePath('/dashboard/frameworks');
  revalidatePath('/dashboard/archive');
  return { success: true };
}

// Permanently delete framework (hard delete with cascade)
export async function permanentlyDeleteFramework(id: string): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database not configured' };

  const { error } = await supabase
    .from('marketing_frameworks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to permanently delete framework:', error);
    return { error: 'Failed to permanently delete framework' };
  }

  revalidatePath('/dashboard/archive');
  return { success: true };
}

// Get archived frameworks
export async function getArchivedFrameworks(): Promise<Framework[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('marketing_frameworks')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch archived frameworks:', error);
    return [];
  }

  return data || [];
}

// Duplicate framework
export async function duplicateFramework(id: string): Promise<{ success: boolean; id?: string } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database not configured' };
  
  // Get original framework
  const { data: original, error: fetchError } = await supabase
    .from('marketing_frameworks')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !original) {
    console.error('Failed to fetch framework:', fetchError);
    return { error: 'Framework not found' };
  }
  
  // Create duplicate with "Copy of" prefix
  const { data: duplicate, error: insertError } = await supabase
    .from('marketing_frameworks')
    .insert({
      user_id: original.user_id,
      name: `Copy of ${original.name}`,
      description: original.description,
      category: original.category,
      content: original.content,
    })
    .select()
    .single();
  
  if (insertError || !duplicate) {
    console.error('Failed to duplicate framework:', insertError);
    return { error: 'Failed to duplicate framework' };
  }
  
  // Generate embeddings for the duplicate
  generateFrameworkEmbeddings(duplicate.id, duplicate.content).catch(err => {
    console.error('Failed to generate embeddings for duplicate:', err);
  });
  
  revalidatePath('/dashboard/frameworks');
  return { success: true, id: duplicate.id };
}

// Generate embeddings for framework content
async function generateFrameworkEmbeddings(frameworkId: string, content: string) {
  const supabase = await createClient();
  if (!supabase) return;
  
  // Check if OpenAI key exists
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set - skipping embedding generation');
    return;
  }

  // Chunk the content
  const chunks = chunkText(content, 1000, 100);
  
  // Generate embeddings for each chunk
  const embeddingPromises = chunks.map(async (chunk, index) => {
    try {
      const embedding = await generateEmbedding(chunk);
      if (!embedding) return null;
      
      return {
        framework_id: frameworkId,
        chunk_index: index,
        content: chunk,
        embedding,
      };
    } catch (error) {
      console.error(`Failed to embed chunk ${index}:`, error);
      return null;
    }
  });

  const embeddings = (await Promise.all(embeddingPromises)).filter(Boolean);

  if (embeddings.length > 0) {
    const { error } = await supabase
      .from('framework_chunks')
      .insert(embeddings);

    if (error) {
      console.error('Failed to store embeddings:', error);
    }
  }
}

// Helper function to chunk text
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

// Get framework categories for dropdown
export async function getFrameworkCategories(): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) return ['copywriting', 'strategy', 'funnel', 'ads', 'email'];
  
  const { data } = await supabase
    .from('marketing_frameworks')
    .select('category')
    .is('deleted_at', null)  // Exclude soft-deleted frameworks
    .not('category', 'is', null);

  if (!data) return ['copywriting', 'strategy', 'funnel', 'ads', 'email'];

  const categories = [...new Set(data.map(d => d.category).filter(Boolean))] as string[];
  
  // Add default categories if empty
  if (categories.length === 0) {
    return ['copywriting', 'strategy', 'funnel', 'ads', 'email'];
  }

  return categories;
}

