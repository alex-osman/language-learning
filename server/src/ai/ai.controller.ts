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
import { CharacterDTO } from '@shared/interfaces/data.interface';

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
  async generateMovie(
    @Param('characterId') characterId: string,
    @Body() requestBody: { userInput?: string },
  ) {
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

    const result = await this.movieService.generateMovie(
      character,
      requestBody.userInput,
    );

    await this.characterService.update(character.id, {
      movie: result.text,
      imgUrl: result.imageUrl,
    });

    return {
      movie: result.text,
      imageUrl: result.imageUrl,
    };
  }

  @Post('generate-image')
  async generateImage(
    @Body() requestBody: { characterId: number; prompt: string },
  ) {
    try {
      const character = await this.characterService.getOneCharacterDTO(
        requestBody.characterId,
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

      const result = await this.movieService.generateImage(
        requestBody.prompt,
        character,
      );
      console.log('result', result);
      await this.characterService.update(character.id, {
        imgUrl: result,
      });

      return { imageUrl: result || '' };
    } catch (error: any) {
      this.logger.error(`Image generation failed:`);
      if (error?.error?.message) {
        console.log(error?.error?.message);
      } else {
        console.log(error);
      }

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate image',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
