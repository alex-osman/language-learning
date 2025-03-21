import { Injectable, Logger } from '@nestjs/common';
import { BaseAiService } from './base-ai.service';
import { CritiqueRequestDto } from '../dto/critique-request.dto';
import { CritiqueResponseDto } from '../dto/critique-response.dto';
import { ConversationService } from './conversation.service';
import { CritiqueResponseSchema } from '../schemas/critique-response.schema';
import { Language } from '@shared/types/languages';

@Injectable()
export class CritiqueAiService extends BaseAiService {
  private readonly logger = new Logger(CritiqueAiService.name);

  private readonly FRENCH_SYSTEM_PROMPT = `You are a helpful French language teacher chatting with a beginner-level learner. The learner is talking to sombody and you are helping them practice their French. After each learner sentence, briefly mention only clear, important grammar or vocabulary errors if they significantly affect understanding. If there are no important errors, do not mention corrections.  Always be friendly, encouraging, and concise. Keep the conversation flowing naturally, and avoid unnecessary corrections or overly detailed explanations.  Answer in French.  Do not worry about the other person's responses, only critique the learner's French.  Do not include any minor errors or lack of punctuation.  If no response is required, just say "OK".`;

  private readonly CHINESE_SYSTEM_PROMPT = `You are a helpful Chinese language teacher chatting with a beginner-level learner. The learner is talking to sombody and you are helping them practice their Chinese. After each learner sentence, briefly mention only clear, important grammar or vocabulary errors if they significantly affect understanding. If there are no important errors, do not mention corrections.  Always be friendly, encouraging, and concise. Keep the conversation flowing naturally, and avoid unnecessary corrections or overly detailed explanations.  Do not worry about the other person's responses, only critique the learner's Chinese.  Do not include any minor errors or lack of punctuation.  Answer in English, but feel free to use chinese characters and always provide the pinyin and english translation. If no response is required, just say "OK".`;

  constructor(private readonly conversationService: ConversationService) {
    super();
  }

  async generateCritiqueResponse(
    request: CritiqueRequestDto,
  ): Promise<CritiqueResponseDto> {
    this.logger.log(
      `Generating critique response for request: ${JSON.stringify(request)}`,
    );

    // Get or create conversation
    const conversationId =
      request.conversationId || this.conversationService.createConversation();

    this.logger.log(`Using critique conversation ID: ${conversationId}`);

    try {
      // Get recent messages from both conversations
      const critiqueMessages = request.conversationId
        ? this.conversationService.getRecentMessages(conversationId)
        : [];

      // Get messages from the main conversation being critiqued
      let mainConversationContext = '';
      if (request.mainConversationId) {
        try {
          const mainMessages = this.conversationService.getRecentMessages(
            request.mainConversationId,
          );
          mainConversationContext = `Here are the recent messages from the conversation:\n\n${mainMessages
            .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n')}`;
        } catch (error) {
          this.logger.warn(
            `Failed to get main conversation messages: ${error.message}`,
          );
          mainConversationContext =
            'Unable to retrieve the main conversation messages.';
        }
      }
      const systemPrompt =
        request.language === Language.CHINESE
          ? this.CHINESE_SYSTEM_PROMPT
          : this.FRENCH_SYSTEM_PROMPT;

      // Build the messages array for the API call
      const apiMessages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...critiqueMessages,
        {
          role: 'user' as const,
          content: `${mainConversationContext}\n\nUser Question/Comment: ${request.text}`,
        },
      ];

      // Get completion from OpenAI
      this.logger.debug('Requesting chat completion from OpenAI!');
      const completion = await this.openai.chat.completions.create({
        model: this.CHAT_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseContent =
        completion.choices[0].message.content || 'No response generated.';
      this.logger.debug(`Received response: ${responseContent}`);

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
        responseContent,
      );

      const response = {
        text: responseContent,
        conversationId,
      };

      // Validate with Zod schema
      const validatedResponse = CritiqueResponseSchema.parse(response);

      this.logger.log(
        `Successfully generated critique response for conversation ${conversationId}`,
      );
      return validatedResponse;
    } catch (error) {
      this.logger.error(
        `Error generating critique response: ${error.message}`,
        error.stack,
      );
      this.logger.error(`Request details: ${JSON.stringify(request)}`);
      throw {
        message: 'Failed to generate critique response',
        cause: error.message,
        conversationId,
      };
    }
  }
}
