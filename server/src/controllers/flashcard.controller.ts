import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FlashcardService } from '../services/flashcard.service';
import { CharacterService } from '../services/character.service';
import { Character } from '../entities/character.entity';
import { CharacterDTO } from '@shared/interfaces/data.interface';
import { UserID } from 'src/decorators/user.decorator';

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
  async getDueCards(
    @UserID() userId: number,
  ): Promise<{ characters: CharacterDTO[]; total: number }> {
    const dueCharacters = await this.flashcardService.getDueCards(userId);
    const total = await this.flashcardService.getTotalNumberOfCards(userId);

    // Convert to DTOs with user context
    return {
      characters: await Promise.all(
        dueCharacters.map((char) =>
          this.characterService.makeCharacterDTO(char, userId),
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
    @UserID() userId: number,
  ): Promise<{ characters: CharacterDTO[]; total: number }> {
    // Get characters for practice, regardless of due status
    const practiceCharacters = await this.flashcardService.getPracticeCards(
      limit,
      userId,
    );
    const total = await this.flashcardService.getTotalNumberOfCards(userId);

    // Convert to DTOs with user context
    return {
      characters: await Promise.all(
        practiceCharacters.map((char) =>
          this.characterService.makeCharacterDTO(char, userId),
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
    @UserID() userId: number,
  ): Promise<CharacterDTO> {
    const updatedCharacter = await this.flashcardService.processReview(
      id,
      request.quality,
      userId,
    );
    return this.characterService.makeCharacterDTO(updatedCharacter, userId);
  }

  /**
   * Start learning a new character
   */
  @Post(':id/learn')
  async startLearning(
    @Param('id') id: number,
    @UserID() userId: number,
  ): Promise<CharacterDTO> {
    const character = await this.flashcardService.startLearning(id, userId);
    return this.characterService.makeCharacterDTO(character, userId);
  }

  /**
   * Reset learning progress for a character
   */
  @Post(':id/reset')
  async resetLearning(
    @Param('id') id: number,
    @UserID() userId: number,
  ): Promise<CharacterDTO> {
    const character = await this.flashcardService.resetLearning(id, userId);
    return this.characterService.makeCharacterDTO(character, userId);
  }
}
