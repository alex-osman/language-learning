import { Injectable, Logger } from '@nestjs/common';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ChatResponseDto } from '../dto/chat-response.dto';
import { BaseAiService } from './base-ai.service';
import { ConversationService } from './conversation.service';

interface ChatError extends Error {
  cause?: string;
  conversationId?: string;
}

@Injectable()
export class FrenchChatAiService extends BaseAiService {
  private readonly logger = new Logger(FrenchChatAiService.name);
  private readonly SYSTEM_PROMPT = `You are a helpful French language tutor. Respond in both French and English. Keep responses natural, conversational, and helpful for language learning. Format your responses as:

French: [French text]
English: [English translation]`;

  constructor(private readonly conversationService: ConversationService) {
    super();
  }

  async generateFrenchChatResponse(
    request: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    this.logger.log(
      `Generating French chat response for request: ${JSON.stringify(request)}`,
    );

    // Get or create conversation
    const conversationId =
      request.conversationId || this.conversationService.createConversation();
    this.logger.log(`Using conversation ID: ${conversationId}`);

    try {
      // Get recent messages
      const messages = request.conversationId
        ? this.conversationService.getRecentMessages(conversationId)
        : [];

      // Build the messages array for the API call
      const apiMessages = [
        { role: 'system' as const, content: this.SYSTEM_PROMPT },
        ...messages,
        { role: 'user' as const, content: request.text },
      ];

      // Get completion from OpenAI
      this.logger.debug('Requesting chat completion from OpenAI');
      const completion = await this.openai.chat.completions.create({
        model: this.CHAT_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseContent =
        completion.choices[0].message.content || 'No response generated.';
      this.logger.debug(`Received response: ${responseContent}`);

      // Parse the response to extract French and English parts
      const [french, english] = this.parseResponse(responseContent);

      // Save the conversation history
      if (!request.conversationId) {
        this.logger.debug('Adding system prompt to new conversation');
        this.conversationService.addMessageToConversation(
          conversationId,
          'system',
          this.SYSTEM_PROMPT,
        );
      }

      this.logger.debug('Saving conversation messages');
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
        base: english,
        target: french,
        conversationId,
      };
    } catch (error) {
      const chatError = error as ChatError;
      this.logger.error(
        `Error generating French chat response: ${chatError.message}`,
        chatError.stack,
      );
      this.logger.error(`Request details: ${JSON.stringify(request)}`);

      const err = new Error(
        'Failed to generate French chat response',
      ) as ChatError;
      err.cause = chatError.message;
      err.conversationId = conversationId;
      throw err;
    }
  }

  private parseResponse(response: string): [string, string] {
    // Default values in case parsing fails
    let french = response;
    let english = response;

    try {
      // Try to find French and English parts
      // Common patterns: "French: ... English: ..." or "French text\nEnglish text"
      const frenchMatch = response.match(/French:\s*([\s\S]*?)(?=English:|$)/i);
      const englishMatch = response.match(/English:\s*([\s\S]*?)$/i);

      if (frenchMatch && englishMatch) {
        french = frenchMatch[1].trim();
        english = englishMatch[1].trim();
      }
    } catch (error) {
      const parseError = error as Error;
      this.logger.warn('Failed to parse response parts:', parseError);
    }

    return [french, english];
  }
}
