import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository, IsNull, Not } from 'typeorm';
import { Character } from '../entities/character.entity';
import { UserCharacterKnowledgeService } from './user-character-knowledge.service';
import { UserCharacterKnowledge } from 'src/entities/user-character-knowledge.entity';

// Response quality ratings (0-5)
enum QualityRating {
  COMPLETE_BLACKOUT = 0, // Complete blackout, incorrect response
  INCORRECT_REMEMBERED = 1, // Incorrect response, but remembered when shown
  INCORRECT_EASY = 2, // Incorrect response, but the correct one seemed easy once shown
  CORRECT_DIFFICULT = 3, // Correct response, but required significant effort
  CORRECT_HESITATION = 4, // Correct response after a hesitation
  PERFECT = 5, // Perfect response
}

@Injectable()
export class FlashcardService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(UserCharacterKnowledge)
    private userCharacterKnowledgeRepository: Repository<UserCharacterKnowledge>,
    private userCharacterKnowledgeService: UserCharacterKnowledgeService,
  ) {}

  /**
   * Get all characters due for review today
   */
  async getDueCards(userId: number): Promise<Character[]> {
    return this.userCharacterKnowledgeService.getDueCardsForUser(userId);
  }

  async getTotalNumberOfCards(userId: number): Promise<number> {
    return this.userCharacterKnowledgeRepository.count({
      where: {
        userID: userId,
      },
    });
  }

  /**
   * Get practice cards even when none are due
   * This provides cards for users who want to practice regardless of the schedule
   * @param limit The maximum number of cards to return
   */
  async getPracticeCards(
    limit: number = 10,
    userId: number,
  ): Promise<Character[]> {
    return this.userCharacterKnowledgeService.getPracticeCardsForUser(
      userId,
      limit,
    );
  }

  /**
   * Process review of a character using SM-2 algorithm
   * @param characterId The ID of the character being reviewed
   * @param quality The quality of response (0-5)
   */
  async processReview(
    characterId: number,
    quality: QualityRating,
    userId: number,
  ): Promise<Character> {
    return this.userCharacterKnowledgeService.processReviewForUser(
      userId,
      characterId,
      quality,
    );
  }

  /**
   * Start learning a new character
   * @param characterId The ID of the character to start learning
   */
  async startLearning(characterId: number, userId: number): Promise<Character> {
    return this.userCharacterKnowledgeService.startLearningForUser(
      userId,
      characterId,
    );
  }

  /**
   * Reset a character's learning progress
   * @param characterId The ID of the character to reset
   */
  async resetLearning(characterId: number, userId: number): Promise<Character> {
    return this.userCharacterKnowledgeService.resetLearningForUser(
      userId,
      characterId,
    );
  }
}
