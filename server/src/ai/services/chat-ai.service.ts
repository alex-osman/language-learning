import { Injectable, Logger } from '@nestjs/common';
import { BaseAiService } from './base-ai.service';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ChatResponseDto } from '../dto/chat-response.dto';
import { ConversationService } from './conversation.service';
import { TranslationSchema } from '../schemas/chat-response.schema';

@Injectable()
export class ChatAiService extends BaseAiService {
  private readonly logger = new Logger(ChatAiService.name);

  private readonly SYSTEM_PROMPT = `请用简单、清晰的中文回答学生的问题（不要使用英文或拼音）。`;

  private readonly STRUCTURE_PROMPT = `请将下面的句子转换成JSON格式，包含以下三个字段：
1. chinese: 原始中文句子
2. pinyin: 拼音（使用声调符号，如：nǐ hǎo）
3. english: 英文翻译

只需返回一个有效的JSON对象，不要添加任何其他文本或解释。
例如：
{
  "chinese": "你好",
  "pinyin": "nǐ hǎo",
  "english": "Hello"
}`;

  constructor(private readonly conversationService: ConversationService) {
    super();
  }

  async generateChatResponse(
    request: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    this.logger.log(
      `Generating chat response for request: ${JSON.stringify(request)}`,
    );

    // Get or create conversation
    const conversationId =
      request.conversationId || this.conversationService.createConversation();

    this.logger.log(`Using conversation ID: ${conversationId}`);

    try {
      // Get recent messages or start new conversation
      const messages = request.conversationId
        ? this.conversationService.getRecentMessages(conversationId)
        : [];

      this.logger.debug(`Retrieved ${messages.length} previous messages`);

      // Build the messages array for the API call
      const apiMessages = [
        { role: 'system' as const, content: this.SYSTEM_PROMPT },
        ...messages,
        { role: 'user' as const, content: request.text },
      ];

      // Get initial completion from OpenAI
      this.logger.debug('Requesting initial chat completion from OpenAI');
      const completion = await this.openai.chat.completions.create({
        model: this.CHAT_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 150,
      });

      const responseContent =
        completion.choices[0].message.content || 'No response generated.';
      this.logger.debug(`Received initial response: ${responseContent}`);

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

      let structuredResponse;
      try {
        const parsedJson = JSON.parse(structuredContent);
        // Validate with Zod schema
        structuredResponse = TranslationSchema.parse(parsedJson);
      } catch (error) {
        this.logger.error(
          `Failed to parse/validate structured response: ${error.message}`,
        );
        this.logger.error(`Problematic content: ${structuredContent}`);
        structuredResponse = {
          chinese: responseContent,
          pinyin: '',
          english: '',
        };
      }

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

      const response = {
        ...structuredResponse,
        conversationId,
      };

      this.logger.log(
        `Successfully generated response for conversation ${conversationId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error generating chat response: ${error.message}`,
        error.stack,
      );
      this.logger.error(`Request details: ${JSON.stringify(request)}`);
      throw {
        message: 'Failed to generate chat response',
        cause: error.message,
        conversationId,
      };
    }
  }
}
