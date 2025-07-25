import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sentence } from '../entities/sentence.entity';

// Response quality ratings (0-5)
enum QualityRating {
  COMPLETE_BLACKOUT = 0, // Complete blackout, incorrect response
  INCORRECT_REMEMBERED = 1, // Incorrect response, but remembered when shown
  INCORRECT_EASY = 2, // Incorrect response, but the correct one seemed easy once shown
  CORRECT_DIFFICULT = 3, // Correct response, but required significant effort
  CORRECT_HESITATION = 4, // Correct response after a hesitation
  PERFECT = 5, // Perfect response
}

export interface SceneProgressStats {
  totalSentences: number;
  practicedSentences: number;
  averageEasiness: number;
  averageInterval: number;
  completionPercentage: number;
}

@Injectable()
export class SentenceFlashcardService {
  constructor(
    @InjectRepository(Sentence)
    private sentenceRepository: Repository<Sentence>,
  ) {}

  /**
   * Get all sentences for a specific episode
   */
  async getSentencesForEpisode(episodeId: number): Promise<Sentence[]> {
    return this.sentenceRepository.find({
      where: { episode: { id: episodeId } },
      order: { id: 'ASC' },
    });
  }

  /**
   * Get sentences for practice (with optional limit and shuffling)
   */
  async getPracticeSentences(
    episodeId: number,
    limit?: number,
  ): Promise<Sentence[]> {
    const query = this.sentenceRepository
      .createQueryBuilder('sentence')
      .leftJoinAndSelect('sentence.episode', 'episode')
      .where('episode.id = :episodeId', { episodeId })
      .orderBy('sentence.id', 'ASC');

    if (limit) {
      query.limit(limit);
    }

    return query.getMany();
  }

  /**
   * Get total sentence count for an episode
   */
  async getTotalSentenceCount(episodeId: number): Promise<number> {
    return this.sentenceRepository.count({
      where: { episode: { id: episodeId } },
    });
  }

  /**
   * Get episode progress statistics
   */
  async getEpisodeProgress(episodeId: number): Promise<any> {
    // This would require implementing progress statistics
    // For now, return a simple response
    const totalSentences = await this.getTotalSentenceCount(episodeId);
    return {
      totalSentences,
      practicedSentences: 0,
      averageEasiness: 2.5,
      averageInterval: 1,
      completionPercentage: 0,
    };
  }


  /**
   * Process review of a sentence using SM-2 algorithm
   */
  async processReview(
    sentenceId: number,
    quality: QualityRating,
  ): Promise<Sentence> {
    const sentence = await this.sentenceRepository.findOne({
      where: { id: sentenceId },
    });

    if (!sentence) {
      throw new Error(`Sentence with ID ${sentenceId} not found`);
    }

    // Calculate new easiness factor
    // EF := EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    let newEF =
      sentence.easinessFactor +
      (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // EF should not be less than 1.3
    if (newEF < 1.3) newEF = 1.3;

    let newInterval: number;
    let newRepetitions: number;

    // If the response was correct (3-5)
    if (quality >= 3) {
      if (sentence.repetitions === 0) {
        // First successful review - schedule for 1 day later
        newInterval = 1;
      } else if (sentence.repetitions === 1) {
        // Second successful review - schedule for 6 days later
        newInterval = 6;
      } else {
        // Third or later successful review - use the easiness factor
        newInterval = Math.round(sentence.interval * newEF);
      }

      newRepetitions = sentence.repetitions + 1;
    } else {
      // If response was incorrect, reset repetitions but keep EF
      newInterval = 1;
      newRepetitions = 0;
    }

    // Calculate next review date
    const now = new Date();
    const nextReview = new Date();
    nextReview.setDate(now.getDate() + newInterval);

    // Update sentence with new spaced repetition data
    sentence.easinessFactor = newEF;
    sentence.interval = newInterval;
    sentence.repetitions = newRepetitions;
    sentence.lastReviewDate = now;
    sentence.nextReviewDate = nextReview;

    // Save and return updated sentence
    return this.sentenceRepository.save(sentence);
  }

  /**
   * Start learning a new sentence
   */
  async startLearning(sentenceId: number): Promise<Sentence> {
    const sentence = await this.sentenceRepository.findOne({
      where: { id: sentenceId },
    });

    if (!sentence) {
      throw new Error(`Sentence with ID ${sentenceId} not found`);
    }

    // Initialize spaced repetition parameters for new learning
    const now = new Date();
    sentence.easinessFactor = 2.5; // Default easiness factor
    sentence.repetitions = 0;
    sentence.interval = 0;
    sentence.lastReviewDate = now; // Set last review to now
    sentence.nextReviewDate = now; // Due immediately

    return this.sentenceRepository.save(sentence);
  }

  /**
   * Reset a sentence's learning progress
   */
  async resetLearning(sentenceId: number): Promise<Sentence> {
    const sentence = await this.sentenceRepository.findOne({
      where: { id: sentenceId },
    });

    if (!sentence) {
      throw new Error(`Sentence with ID ${sentenceId} not found`);
    }

    // Reset spaced repetition parameters
    sentence.easinessFactor = 2.5;
    sentence.repetitions = 0;
    sentence.interval = 0;

    // We need to set these to actual dates, we'll use a far future date to indicate "not scheduled"
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 100); // 100 years in the future
    sentence.lastReviewDate = farFuture;
    sentence.nextReviewDate = farFuture;

    return this.sentenceRepository.save(sentence);
  }
}
