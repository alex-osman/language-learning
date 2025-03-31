import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
  async getDueCards(): Promise<{ characters: CharacterDTO[]; total: number }> {
    const dueCharacters = await this.flashcardService.getDueCards();
    const total = await this.flashcardService.getTotalNumberOfCards();

    // Convert to DTOs
    return {
      characters: await Promise.all(
        dueCharacters.map((char) =>
          this.characterService.makeCharacterDTO(char),
        ),
      ),
      total,
    };
  }

  /**
   * Get practice cards even when no cards are due
   * @param limit The number of cards to retrieve for practice (default: 10)
   */
  @Get('practice')
  async getPracticeCards(
    @Query('limit') limit: number = 10,
  ): Promise<{ characters: CharacterDTO[]; total: number }> {
    // Get characters for practice, regardless of due status
    const practiceCharacters =
      await this.flashcardService.getPracticeCards(limit);
    const total = await this.flashcardService.getTotalNumberOfCards();

    // Convert to DTOs
    return {
      characters: await Promise.all(
        practiceCharacters.map((char) =>
          this.characterService.makeCharacterDTO(char),
        ),
      ),
      total,
    };
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
