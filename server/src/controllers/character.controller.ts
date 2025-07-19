import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  UseInterceptors,
  UploadedFile,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CharacterService } from '../services/character.service';
import { UserCharacterKnowledgeService } from '../services/user-character-knowledge.service';
import { CharacterDTO } from '@shared/interfaces/data.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { MovieAiService } from '../ai/services/movie.service';
import { UserID } from 'src/decorators/user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('api/characters')
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name);

  constructor(
    private readonly characterService: CharacterService,
    private readonly userCharacterKnowledgeService: UserCharacterKnowledgeService,
    private readonly movieService: MovieAiService,
  ) {}

  @Get('next-for-movie')
  @UseGuards(AuthGuard)
  async getNextCharacterForMovie(
    @UserID() userId: number,
  ): Promise<CharacterDTO> {
    try {
      const character =
        await this.characterService.getNextCharacterWithoutMovie(userId);

      if (!character) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'No characters without movies found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return character;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to get next character for movie:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to get next character for movie',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/movie')
  async saveCharacterMovie(
    @Param('id') id: string,
    @Body() movieData: { movie: string; imageUrl?: string },
    @UserID() userId: number,
  ): Promise<CharacterDTO> {
    try {
      const characterId = parseInt(id, 10);
      if (isNaN(characterId)) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid character ID',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const character = await this.characterService.getOneCharacterDTO(
        characterId,
        userId,
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

      // Save movie to user-specific data
      const updatedCharacter =
        await this.userCharacterKnowledgeService.saveMovieForUser(
          userId,
          characterId,
          movieData.movie,
          movieData.imageUrl,
        );

      return this.characterService.makeCharacterDTO(updatedCharacter, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to save character movie:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to save character movie',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/radicals')
  async updateCharacterRadicals(
    @Param('id') id: string,
    @Body() radicalData: { radicals: string },
    @UserID() userId: number,
  ): Promise<CharacterDTO> {
    try {
      const characterId = parseInt(id, 10);
      if (isNaN(characterId)) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid character ID',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const character = await this.characterService.getOneCharacterDTO(
        characterId,
        userId,
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

      const updatedCharacter = await this.characterService.update(characterId, {
        radicals: radicalData.radicals.split('').join(','),
      });

      if (!updatedCharacter) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Failed to update character radicals',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return this.characterService.makeCharacterDTO(updatedCharacter, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to update character radicals:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to update character radicals',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadCharacterImage(
    @UploadedFile() file: any,
    @Body('characterId') characterId: string,
    @UserID() userId: number,
  ): Promise<{ imageUrl: string }> {
    try {
      if (!file) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'No file uploaded',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!characterId) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Character ID is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const id = parseInt(characterId, 10);
      if (isNaN(id)) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid character ID',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const character = await this.characterService.getOneCharacterDTO(
        id,
        userId,
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

      // Upload to S3 and get URL
      const imageUrl = await this.movieService.uploadToS3(
        file.buffer,
        `${character.id}.${file.originalname.split('.').pop()}`,
      );

      // Update user-specific image URL
      await this.userCharacterKnowledgeService.saveMovieForUser(
        userId,
        character.id,
        character.movie || '',
        imageUrl,
      );

      return { imageUrl };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to upload character image:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to upload character image',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
