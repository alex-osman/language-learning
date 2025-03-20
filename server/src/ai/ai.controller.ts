import {
  Controller,
  Post,
  Body,
  Header,
  StreamableFile,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TtsRequestDto } from './dto/tts-request.dto';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { CritiqueRequestDto } from './dto/critique-request.dto';
import { CritiqueResponseDto } from './dto/critique-response.dto';
import { TtsAiService } from './services/tts-ai.service';
import { ChatAiService } from './services/chat-ai.service';
import { CritiqueAiService } from './services/critique-ai.service';

@Controller('api/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly ttsService: TtsAiService,
    private readonly chatService: ChatAiService,
    private readonly critiqueService: CritiqueAiService,
  ) {}

  @Post('tts')
  @Header('Content-Type', 'audio/mpeg')
  async generateSpeech(
    @Body() request: TtsRequestDto,
  ): Promise<StreamableFile> {
    try {
      const buffer = await this.ttsService.generateSpeech(request);
      return new StreamableFile(buffer);
    } catch (error) {
      this.logger.error(`TTS generation failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate speech',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('chat')
  async chat(@Body() request: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      return await this.chatService.generateChatResponse(request);
    } catch (error) {
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

  @Post('critique')
  async critique(
    @Body() request: CritiqueRequestDto,
  ): Promise<CritiqueResponseDto> {
    try {
      console.log('Critique request:', request);
      return await this.critiqueService.generateCritiqueResponse(request);
    } catch (error) {
      this.logger.error(
        `Critique generation failed: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate critique response',
          details: error.message,
          conversationId: error.conversationId,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
