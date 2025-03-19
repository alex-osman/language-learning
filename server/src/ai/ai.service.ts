import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { TtsRequestDto } from './dto/tts-request.dto';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ConversationService } from './services/conversation.service';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly CHAT_MODEL = 'gpt-4-turbo-preview';
  private readonly SYSTEM_PROMPT = `You are a helpful Chinese language learning assistant. Keep your responses concise and focused.
Provide brief, clear explanations about Chinese text, including essential grammar and vocabulary insights.
If the text contains Chinese characters, include pinyin and English translations in a compact format.
Keep responses to 2-3 sentences when possible. Be encouraging but brief.
Format responses in a clear, easy-to-read way.`;

  constructor(private readonly conversationService: ConversationService) {
    console.log('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateSpeech(request: TtsRequestDto): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'coral',
      input: request.text,
      speed: request.speed === 'slow' ? 0.85 : 1.0,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }

  async generateChatResponse(
    request: ChatRequestDto,
  ): Promise<{ response: string; conversationId: string }> {
    // Get or create conversation
    const conversationId =
      request.conversationId || this.conversationService.createConversation();

    try {
      // Get recent messages or start new conversation
      const messages = request.conversationId
        ? this.conversationService.getRecentMessages(conversationId)
        : [];

      // Build the messages array for the API call
      const apiMessages = [
        { role: 'system' as const, content: this.SYSTEM_PROMPT },
        ...messages,
        { role: 'user' as const, content: request.text },
      ];

      // Get completion from OpenAI with reduced max tokens
      const completion = await this.openai.chat.completions.create({
        model: this.CHAT_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 150, // Reduced from 1000 to encourage shorter responses
      });

      const responseContent =
        completion.choices[0].message.content || 'No response generated.';

      // Save the conversation history
      if (!request.conversationId) {
        // If it's a new conversation, add the system prompt
        this.conversationService.addMessageToConversation(
          conversationId,
          'system',
          this.SYSTEM_PROMPT,
        );
      }
      this.conversationService.addMessageToConversation(
        conversationId,
        'user',
        request.text,
      );
      this.conversationService.addMessageToConversation(
        conversationId,
        'assistant',
        responseContent,
      );

      return {
        response: responseContent,
        conversationId,
      };
    } catch (error) {
      // If there's an error, we still want to return the conversationId
      // so the frontend can retry with the same conversation
      throw {
        ...error,
        conversationId,
      };
    }
  }
}
