import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FlashcardService } from '../services/flashcard.service';
import { CharacterService } from '../services/character.service';
import { Character } from '../entities/character.entity';
import { CharacterDTO } from '@shared/interfaces/data.interface';

interface ReviewRequest {
  quality: number; // 0-5 quality rating
}

@Controller('api/flashcards')
export class FlashcardController {
  constructor(
    private readonly flashcardService: FlashcardService,
    private readonly characterService: CharacterService,
  ) {}

  /**
   * Get all characters that are due for review
   */
  @Get('due')
  async getDueCards(): Promise<CharacterDTO[]> {
    const dueCharacters = await this.flashcardService.getDueCards();

    // Convert to DTOs
    return Promise.all(
      dueCharacters.map((char) => this.characterService.makeCharacterDTO(char)),
    );
  }

  /**
   * Process a review for a character
   */
  @Post(':id/review')
  async reviewCard(
    @Param('id') id: number,
    @Body() request: ReviewRequest,
  ): Promise<CharacterDTO> {
    const updatedCharacter = await this.flashcardService.processReview(
      id,
      request.quality,
    );
    return this.characterService.makeCharacterDTO(updatedCharacter);
  }

  /**
   * Start learning a new character
   */
  @Post(':id/learn')
  async startLearning(@Param('id') id: number): Promise<CharacterDTO> {
    const character = await this.flashcardService.startLearning(id);
    return this.characterService.makeCharacterDTO(character);
  }

  /**
   * Reset learning progress for a character
   */
  @Post(':id/reset')
  async resetLearning(@Param('id') id: number): Promise<CharacterDTO> {
    const character = await this.flashcardService.resetLearning(id);
    return this.characterService.makeCharacterDTO(character);
  }
}
