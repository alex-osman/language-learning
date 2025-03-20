import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { Language } from '@shared/types/languages';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { ChineseChatAiService } from './services/chat-ai.service';
import { CritiqueAiService } from './services/critique-ai.service';
import { FrenchChatAiService } from './services/french-chat-ai.service';
import { TtsAiService } from './services/tts-ai.service';

@Controller('api/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly ttsService: TtsAiService,
    private readonly chineseChatService: ChineseChatAiService,
    private readonly frenchChatService: FrenchChatAiService,
    private readonly critiqueService: CritiqueAiService,
  ) {}

  // @Post('tts')
  // @Header('Content-Type', 'audio/mpeg')
  // async generateSpeech(
  //   @Body() request: TtsRequestDto,
  // ): Promise<StreamableFile> {
  //   try {
  //     const buffer = await this.ttsService.generateSpeech(request);
  //     return new StreamableFile(buffer);
  //   } catch (error: any) {
  //     this.logger.error(`TTS generation failed: ${error.message}`, error.stack);
  //     throw new HttpException(
  //       {
  //         status: HttpStatus.INTERNAL_SERVER_ERROR,
  //         error: 'Failed to generate speech',
  //         details: error.message,
  //       },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  @Post('chat')
  async chat(@Body() request: ChatRequestDto): Promise<ChatResponseDto> {
    console.log('request', request);
    try {
      console.log('request.language', request.language);
      if (request.language === Language.FRENCH) {
        return await this.frenchChatService.generateFrenchChatResponse(request);
      }
      return await this.chineseChatService.generateChineseChatResponse(request);
    } catch (error: any) {
      this.logger.error(
        `Chat generation failed: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate chat response',
          details: error.message,
          conversationId: error.conversationId,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Post('critique')
  // async critique(
  //   @Body() request: CritiqueRequestDto,
  // ): Promise<CritiqueResponseDto> {
  //   try {
  //     return await this.critiqueService.generateCritiqueResponse(request);
  //   } catch (error: any) {
  //     this.logger.error(
  //       `Critique generation failed: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new HttpException(
  //       {
  //         status: HttpStatus.INTERNAL_SERVER_ERROR,
  //         error: 'Failed to generate critique response',
  //         details: error.message,
  //         conversationId: error.conversationId,
  //       },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}
