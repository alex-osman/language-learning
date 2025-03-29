import {
  Body,
  Controller,
  Header,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { CharacterService } from '../services/character.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { CritiqueRequestDto } from './dto/critique-request.dto';
import { CritiqueResponseDto } from './dto/critique-response.dto';
import { TtsRequestDto } from './dto/tts-request.dto';
import { ChineseChatAiService } from './services/chat-ai.service';
import { CritiqueAiService } from './services/critique-ai.service';
import { FrenchChatAiService } from './services/french-chat-ai.service';
import { TtsAiService } from './services/tts-ai.service';
import { MovieAiService } from './services/movie.service';

enum Language {
  CHINESE = 'Chinese',
  PINYIN = 'Pinyin',
  ENGLISH = 'English',
  FRENCH = 'French',
}

@Controller('api/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly ttsService: TtsAiService,
    private readonly chineseChatService: ChineseChatAiService,
    private readonly frenchChatService: FrenchChatAiService,
    private readonly critiqueService: CritiqueAiService,
    private readonly characterService: CharacterService,
    private readonly movieService: MovieAiService,
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

  @Post('movie/:characterId')
  async generateMovie(@Param('characterId') characterId: string) {
    const character = await this.characterService.getOneCharacterDTO(
      parseInt(characterId),
    );

    if (!character) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Character not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const movie = await this.movieService.generateMovie(character);

    await this.characterService.update(character.id, {
      movie,
    });

    return {
      movie,
    };
  }
}
