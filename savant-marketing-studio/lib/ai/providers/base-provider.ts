export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  finishReason?: string;
}

export abstract class BaseAIProvider {
  abstract name: string;
  abstract generateText(request: AIRequest, modelName: string): Promise<AIResponse>;
  
  calculateCost(inputTokens: number, outputTokens: number, inputCost: number, outputCost: number): number {
    // Costs are per 1M tokens, convert to actual cost
    const inputCostUSD = (inputTokens / 1_000_000) * inputCost;
    const outputCostUSD = (outputTokens / 1_000_000) * outputCost;
    return inputCostUSD + outputCostUSD;
  }
}

