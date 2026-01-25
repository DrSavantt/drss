/**
 * Generate embeddings for all existing marketing frameworks
 * 
 * This script:
 * 1. Fetches all frameworks from marketing_frameworks table
 * 2. Clears existing framework_chunks (idempotent - safe to run multiple times)
 * 3. Chunks each framework's content
 * 4. Generates embeddings using Google Gemini gemini-embedding-001 (2000 dimensions)
 * 5. Inserts chunks with embeddings into framework_chunks table
 * 
 * Run with: npx tsx --env-file=.env.local scripts/generate-framework-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_AI_API_KEY!;

// Embedding configuration
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 2000; // gemini-embedding-001 supports up to 3072, using 2000 for pgvector index limit

// Validate environment
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!googleApiKey) {
  console.error('❌ Missing Google AI API key');
  console.error('Required: GOOGLE_AI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);

// Stats tracking
let totalChunksCreated = 0;
let totalFrameworksProcessed = 0;
let errors: string[] = [];

/**
 * Generate embedding using Google Gemini's gemini-embedding-001 model
 * Uses RETRIEVAL_DOCUMENT task type for optimal document indexing
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    
    // Note: outputDimensionality is supported by the API but not in SDK types
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    } as Parameters<typeof model.embedContent>[0]);
    
    return result.embedding.values;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Chunk text into smaller pieces with overlap
 * Matches the logic in lib/ai/rag.ts and app/actions/frameworks.ts
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

/**
 * Process a single framework - chunk its content and generate embeddings
 */
async function processFramework(framework: { id: string; name: string; content: string; category: string | null }): Promise<boolean> {
  try {
    // Chunk the content
    const chunks = chunkText(framework.content);
    
    if (chunks.length === 0) {
      console.log(`   ⚠️ No chunks generated (empty content?)`);
      return true; // Not an error, just no content
    }

    // Generate embeddings and prepare inserts
    const insertData: Array<{
      framework_id: string;
      chunk_index: number;
      content: string;
      embedding: number[];
    }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      
      if (!embedding) {
        console.log(`   ⚠️ Failed to generate embedding for chunk ${i + 1}/${chunks.length}`);
        continue;
      }

      insertData.push({
        framework_id: framework.id,
        chunk_index: i,
        content: chunk,
        embedding,
      });
      
      // Small delay between embedding requests to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Insert all chunks for this framework
    if (insertData.length > 0) {
      const { error } = await supabase
        .from('framework_chunks')
        .insert(insertData);

      if (error) {
        console.error(`   ❌ Database error:`, error.message);
        errors.push(`${framework.name}: ${error.message}`);
        return false;
      }

      totalChunksCreated += insertData.length;
      console.log(`   ✅ Created ${insertData.length} chunk(s) (${EMBEDDING_DIMENSIONS} dims each)`);
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   ❌ Error:`, message);
    errors.push(`${framework.name}: ${message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('━'.repeat(60));
  console.log('🔮 Framework Embedding Generator');
  console.log('━'.repeat(60));
  console.log(`   Model: Gemini ${EMBEDDING_MODEL}`);
  console.log(`   Dimensions: ${EMBEDDING_DIMENSIONS}`);
  console.log('');

  // Step 1: Fetch all frameworks
  console.log('📋 Fetching frameworks from database...');
  const { data: frameworks, error: fetchError } = await supabase
    .from('marketing_frameworks')
    .select('id, name, content, category')
    .is('deleted_at', null)
    .order('name');

  if (fetchError) {
    console.error('❌ Failed to fetch frameworks:', fetchError.message);
    process.exit(1);
  }

  if (!frameworks || frameworks.length === 0) {
    console.log('⚠️ No frameworks found in database.');
    process.exit(0);
  }

  console.log(`   Found ${frameworks.length} framework(s)\n`);

  // Step 2: Clear existing chunks (makes script idempotent)
  console.log('🧹 Clearing existing framework_chunks...');
  const { error: deleteError, count: deletedCount } = await supabase
    .from('framework_chunks')
    .delete({ count: 'exact' })
    .neq('id', 0); // Delete all rows (neq id 0 matches all since id > 0)

  if (deleteError) {
    console.error('   ⚠️ Warning - could not clear existing chunks:', deleteError.message);
  } else {
    console.log(`   ✅ Removed ${deletedCount || 0} existing chunk(s)\n`);
  }

  // Step 3: Process each framework
  console.log('🔄 Generating embeddings with Gemini...\n');
  
  for (let i = 0; i < frameworks.length; i++) {
    const framework = frameworks[i];
    console.log(`[${i + 1}/${frameworks.length}] ${framework.name}`);
    
    const success = await processFramework(framework);
    if (success) {
      totalFrameworksProcessed++;
    }
    
    // Delay between frameworks to avoid rate limiting
    if (i < frameworks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Step 4: Summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 Summary');
  console.log('━'.repeat(60));
  console.log(`   Frameworks processed: ${totalFrameworksProcessed}/${frameworks.length}`);
  console.log(`   Total chunks created: ${totalChunksCreated}`);
  console.log(`   Embedding dimensions: ${EMBEDDING_DIMENSIONS}`);
  
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.length}`);
    errors.forEach(e => console.log(`      - ${e}`));
  }

  // Step 5: Verification
  console.log('\n📈 Verification:');
  
  const { count: totalCount } = await supabase
    .from('framework_chunks')
    .select('*', { count: 'exact', head: true });
  
  console.log(`   Total rows in framework_chunks: ${totalCount || 0}`);

  // Per-framework breakdown
  const { data: breakdown } = await supabase
    .from('framework_chunks')
    .select('framework_id, content')
    .order('framework_id');
  
  if (breakdown && breakdown.length > 0) {
    const counts = new Map<string, number>();
    breakdown.forEach(chunk => {
      counts.set(chunk.framework_id, (counts.get(chunk.framework_id) || 0) + 1);
    });
    
    console.log('\n   Chunks per framework:');
    
    // Get framework names
    const { data: names } = await supabase
      .from('marketing_frameworks')
      .select('id, name')
      .in('id', Array.from(counts.keys()));
    
    const nameMap = new Map(names?.map(n => [n.id, n.name]) || []);
    
    counts.forEach((count, frameworkId) => {
      const name = nameMap.get(frameworkId) || frameworkId;
      console.log(`      - ${name}: ${count} chunk(s)`);
    });
  }

  console.log('\n✨ Done!');
  console.log('');
  console.log('Verification SQL:');
  console.log('   SELECT COUNT(*) FROM framework_chunks;');
  console.log('   SELECT array_length(embedding, 1) FROM framework_chunks LIMIT 1;');
  console.log('   -- Should return 2000');
  console.log('');
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
