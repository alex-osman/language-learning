import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Character } from '../entities/character.entity';

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
  ) {}

  async getTotalNumberOfCards(): Promise<number> {
    return this.characterRepository.count();
  }

  /**
   * Get all characters due for review today
   */
  async getDueCards(): Promise<Character[]> {
    const now = new Date();
    return this.characterRepository.find({
      where: {
        nextReviewDate: LessThanOrEqual(now),
      },
      order: {
        nextReviewDate: 'ASC',
      },
    });
  }

  /**
   * Process review of a character using SM-2 algorithm
   * @param characterId The ID of the character being reviewed
   * @param quality The quality of response (0-5)
   */
  async processReview(
    characterId: number,
    quality: QualityRating,
  ): Promise<Character> {
    const character = await this.characterRepository.findOne({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    // Calculate new easiness factor
    // EF := EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    let newEF =
      character.easinessFactor +
      (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // EF should not be less than 1.3
    if (newEF < 1.3) newEF = 1.3;

    let newInterval: number;
    let newRepetitions: number;

    // If the response was correct (3-5)
    if (quality >= 3) {
      if (character.repetitions === 0) {
        // First successful review - schedule for 1 day later
        newInterval = 1;
      } else if (character.repetitions === 1) {
        // Second successful review - schedule for 6 days later
        newInterval = 6;
      } else {
        // Third or later successful review - use the easiness factor
        newInterval = Math.round(character.interval * newEF);
      }

      newRepetitions = character.repetitions + 1;
    } else {
      // If response was incorrect, reset repetitions but keep EF
      newInterval = 1;
      newRepetitions = 0;
    }

    // Calculate next review date
    const now = new Date();
    const nextReview = new Date();
    nextReview.setDate(now.getDate() + newInterval);

    // Update character with new spaced repetition data
    character.easinessFactor = newEF;
    character.interval = newInterval;
    character.repetitions = newRepetitions;
    character.lastReviewDate = now;
    character.nextReviewDate = nextReview;

    // Save and return updated character
    return this.characterRepository.save(character);
  }

  /**
   * Start learning a new character
   * @param characterId The ID of the character to start learning
   */
  async startLearning(characterId: number): Promise<Character> {
    const character = await this.characterRepository.findOne({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    // Initialize spaced repetition parameters for new learning
    const now = new Date();
    character.easinessFactor = 2.5; // Default easiness factor
    character.repetitions = 0;
    character.interval = 0;
    character.lastReviewDate = now; // Set last review to now
    character.nextReviewDate = now; // Due immediately

    return this.characterRepository.save(character);
  }

  /**
   * Reset a character's learning progress
   * @param characterId The ID of the character to reset
   */
  async resetLearning(characterId: number): Promise<Character> {
    const character = await this.characterRepository.findOne({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    // Reset spaced repetition parameters
    character.easinessFactor = 2.5;
    character.repetitions = 0;
    character.interval = 0;

    // We need to set these to actual dates, we'll use a far future date to indicate "not scheduled"
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 100); // 100 years in the future
    character.lastReviewDate = farFuture;
    character.nextReviewDate = farFuture;

    return this.characterRepository.save(character);
  }
}
