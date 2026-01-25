// AI Module Exports
export { AIOrchestrator } from './orchestrator';
export type { TaskComplexity, TaskPriority } from './orchestrator';

export { BaseAIProvider } from './providers/base-provider';
export type { AIMessage, AIRequest, AIResponse } from './providers/base-provider';

export { ClaudeProvider } from './providers/claude';
export { GeminiProvider } from './providers/gemini';

export { searchFrameworks, getFrameworksByCategory, addFramework } from './rag';
export { 
  generateEmbedding, 
  generateEmbeddings, 
  generateQueryEmbedding,
  getEmbeddingDimensions,
  getEmbeddingModel,
} from './embeddings';

