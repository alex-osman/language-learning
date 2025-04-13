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
} from '@nestjs/common';
import { CharacterService } from '../services/character.service';
import { CharacterDTO } from '@shared/interfaces/data.interface';

@Controller('api/characters')
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name);

  constructor(private readonly characterService: CharacterService) {}

  @Get('next-for-movie')
  async getNextCharacterForMovie(): Promise<CharacterDTO> {
    try {
      const character =
        await this.characterService.getNextCharacterWithoutMovie();

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

      const character =
        await this.characterService.getOneCharacterDTO(characterId);
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
        movie: movieData.movie,
        imgUrl: movieData.imageUrl,
      });

      if (!updatedCharacter) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Failed to update character',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return this.characterService.makeCharacterDTO(updatedCharacter);
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

      const character =
        await this.characterService.getOneCharacterDTO(characterId);
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

      return this.characterService.makeCharacterDTO(updatedCharacter);
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
}
