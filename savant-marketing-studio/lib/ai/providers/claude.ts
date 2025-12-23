import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider, AIRequest, AIResponse } from './base-provider';

export class ClaudeProvider extends BaseAIProvider {
  name = 'claude';
  private client: Anthropic;

  constructor() {
    super();
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateText(request: AIRequest, modelName: string): Promise<AIResponse> {
    try {
      const response = await this.client.messages.create({
        model: modelName,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 1,
        system: request.systemPrompt,
        messages: request.messages.map(msg => ({
          role: msg.role === 'system' ? 'user' : msg.role,
          content: msg.content,
        })),
      });

      const textContent = response.content.find(block => block.type === 'text');
      
      return {
        content: textContent?.type === 'text' ? textContent.text : '',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: response.model,
        finishReason: response.stop_reason || undefined,
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Claude API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

