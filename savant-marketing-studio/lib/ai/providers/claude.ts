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
      // Extended thinking requires temperature = 1 and higher max_tokens
      const temperature = request.useExtendedThinking ? 1 : (request.temperature || 1);
      const thinkingBudget = request.thinkingBudget || 10000;
      
      // When thinking is enabled, max_tokens must be > budget_tokens
      // Set max_tokens to budget + 8000 for the actual response
      const maxTokens = request.useExtendedThinking 
        ? thinkingBudget + 8000  // e.g., 10000 + 8000 = 18000
        : (request.maxTokens || 4096);

      const response = await this.client.messages.create({
        model: modelName,
        max_tokens: maxTokens,
        temperature,
        system: request.systemPrompt,
        messages: request.messages.map(msg => ({
          role: msg.role === 'system' ? 'user' : msg.role,
          content: msg.content,
        })),
        // Add extended thinking when enabled
        ...(request.useExtendedThinking && {
          thinking: {
            type: 'enabled' as const,
            budget_tokens: request.thinkingBudget || 10000,
          },
        }),
      });

      // Handle response - may have thinking and text blocks
      let textContent = '';
      let thinkingContent: string | undefined;

      for (const block of response.content) {
        if (block.type === 'thinking') {
          thinkingContent = block.thinking;
        } else if (block.type === 'text') {
          textContent = block.text;
        }
      }

      return {
        content: textContent,
        thinking: thinkingContent,
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

