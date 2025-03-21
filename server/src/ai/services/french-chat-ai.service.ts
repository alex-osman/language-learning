import { Injectable, Logger } from '@nestjs/common';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ChatResponseDto } from '../dto/chat-response.dto';
import { BaseAiService } from './base-ai.service';
import { ConversationService } from './conversation.service';
import {
  FrenchTranslation,
  FrenchTranslationSchema,
} from '../schemas/chat-response.schema';
import { ZodError } from 'zod';

interface ChatError extends Error {
  cause?: string;
  conversationId?: string;
}

@Injectable()
export class FrenchChatAiService extends BaseAiService {
  private readonly logger = new Logger(FrenchChatAiService.name);
  private readonly SYSTEM_PROMPT = `You are a helpful French language tutor. Respond in both French and English. Keep responses natural, conversational, and helpful for language learning. Make sure to keep the conversation flowing. Answer in 1-3 sentences.`;

  private readonly STRUCTURE_PROMPT = `Please convert the following response into a JSON format with these fields:
1. french: The French text
2. english: The English translation

Return only a valid JSON object without any additional text or explanation.
Example:
{
  "french": "Bonjour, comment allez-vous?",
  "english": "Hello, how are you?"
}`;

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

      // Get initial completion from OpenAI
      this.logger.debug('Requesting chat completion from OpenAI');
      const completion = await this.openai.chat.completions.create({
        model: this.CHAT_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 150,
      });

      const responseContent =
        completion.choices[0].message.content || 'No response generated.';
      this.logger.debug(`Received response: ${responseContent}`);

      // Get structured format
      this.logger.debug('Requesting structured format conversion');
      const structureMessages = [
        { role: 'system' as const, content: this.STRUCTURE_PROMPT },
        { role: 'user' as const, content: responseContent },
      ];

      const structuredCompletion = await this.openai.chat.completions.create({
        model: this.CHAT_MODEL,
        messages: structureMessages,
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const structuredContent =
        structuredCompletion.choices[0].message.content || '{}';
      this.logger.debug(`Received structured response: ${structuredContent}`);

      let structuredResponse: FrenchTranslation;
      try {
        const parsedJson = JSON.parse(structuredContent) as Record<
          string,
          unknown
        >;
        // Validate with Zod schema
        structuredResponse = FrenchTranslationSchema.parse(parsedJson);
      } catch (error) {
        const parseError = error as Error | ZodError;
        this.logger.error(
          `Failed to parse/validate structured response: ${parseError.message}`,
        );
        this.logger.error(`Problematic content: ${structuredContent}`);
        structuredResponse = {
          french: responseContent,
          english: responseContent,
        };
      }

      // Save the conversation history
      if (!request.conversationId) {
        this.logger.debug('Starting new conversation');
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
        structuredResponse.french,
      );

      return {
        base: structuredResponse.english,
        target: structuredResponse.french,
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
}
