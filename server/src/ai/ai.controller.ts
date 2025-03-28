import {
  Body,
  Controller,
  Header,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { Language } from '@shared/types/languages';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { ChineseChatAiService } from './services/chat-ai.service';
import { CritiqueAiService } from './services/critique-ai.service';
import { FrenchChatAiService } from './services/french-chat-ai.service';
import { TtsAiService } from './services/tts-ai.service';
import { TtsRequestDto } from './dto/tts-request.dto';
import { CritiqueRequestDto } from './dto/critique-request.dto';
import { CritiqueResponseDto } from './dto/critique-response.dto';
import {
  MovieGenerationRequestDto,
  MovieGenerationResponseDto,
} from './dto/movie-generation.dto';
import { MovieAiService } from './services/movie.service';
import { DataService } from 'src/services/data.service';

@Controller('api/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly ttsService: TtsAiService,
    private readonly chineseChatService: ChineseChatAiService,
    private readonly frenchChatService: FrenchChatAiService,
    private readonly critiqueService: CritiqueAiService,
    private readonly movieService: MovieAiService,
    private readonly dataService: DataService,
  ) {}

  @Post('tts')
  @Header('Content-Type', 'audio/mpeg')
  async generateSpeech(
    @Body() request: TtsRequestDto,
  ): Promise<StreamableFile> {
    try {
      const buffer = await this.ttsService.generateSpeech(request);
      return new StreamableFile(buffer);
    } catch (error: any) {
      this.logger.error(`TTS generation failed:`);
      console.log(error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate speech',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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
      this.logger.error(`Chat generation failed:`);
      console.log(error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate chat response',
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
      return await this.critiqueService.generateCritiqueResponse(request);
    } catch (error: any) {
      this.logger.error(`Critique generation failed:`);
      console.log(error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate critique response',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('movie')
  async generateMovie(
    @Body() request: MovieGenerationRequestDto,
  ): Promise<MovieGenerationResponseDto> {
    try {
      const movieGenerationResponse =
        await this.movieService.generateMovie(request);
      // Save movie to database
      this.dataService.addMovieToCharacter(
        request.character,
        movieGenerationResponse.movie,
      );
      return movieGenerationResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Movie generation failed: ${errorMessage}`, errorStack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate movie scene',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
