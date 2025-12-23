import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider, AIRequest, AIResponse } from './base-provider';

export class GeminiProvider extends BaseAIProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor() {
    super();
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
  }

  async generateText(request: AIRequest, modelName: string): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: modelName,
        systemInstruction: request.systemPrompt,
      });

      // Convert messages to Gemini format
      const history = request.messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user' as const,
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({ history });

      const lastMessage = request.messages[request.messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;

      // Gemini provides token counts via usageMetadata
      const usageMetadata = response.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount ?? 
        Math.ceil(request.messages.reduce((sum, msg) => sum + msg.content.length, 0) / 4);
      const outputTokens = usageMetadata?.candidatesTokenCount ?? 
        Math.ceil(response.text().length / 4);

      return {
        content: response.text(),
        inputTokens,
        outputTokens,
        model: modelName,
        finishReason: response.candidates?.[0]?.finishReason,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

