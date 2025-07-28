import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { UserSentenceKnowledge } from '../entities/user-sentence-knowledge.entity';
import { SentenceAnalyzerService } from './sentence-analyzer.service';

@Injectable()
export class UserSentenceKnowledgeService {
  constructor(
    @InjectRepository(UserSentenceKnowledge)
    private userSentenceKnowledgeRepository: Repository<UserSentenceKnowledge>,
    private sentenceAnalyzerService: SentenceAnalyzerService,
  ) {}

  /**
   * Get comprehension data for a specific sentence and user
   */
  async findByUserAndSentence(
    userId: number,
    sentenceId: number,
  ): Promise<UserSentenceKnowledge | null> {
    return this.userSentenceKnowledgeRepository.findOne({
      where: { userID: userId, sentenceID: sentenceId },
    });
  }

  /**
   * Get all sentences that meet a minimum comprehension threshold for a user
   */
  async findComprehensibleSentences(
    userId: number,
    minComprehension: number = 80,
    limit: number = 100,
  ): Promise<UserSentenceKnowledge[]> {
    return this.userSentenceKnowledgeRepository.find({
      where: {
        userID: userId,
        comprehensionPercentage: MoreThanOrEqual(minComprehension),
      },
      relations: ['sentence', 'sentence.episode'],
      order: { comprehensionPercentage: 'DESC' },
      take: limit,
    });
  }

  /**
   * Calculate and cache comprehension for a specific sentence and user
   */
  async calculateAndCacheComprehension(
    userId: number,
    sentenceId: number,
    sentenceText: string,
  ): Promise<UserSentenceKnowledge> {
    // Use existing sentence analyzer to get comprehension data
    const analysis = await this.sentenceAnalyzerService.analyzeSentence(
      sentenceText,
      userId,
    );

    // Check if we already have a record for this user/sentence
    let existingRecord = await this.findByUserAndSentence(userId, sentenceId);

    const comprehensionData = {
      userID: userId,
      sentenceID: sentenceId,
      comprehensionPercentage: analysis.known_percent,
      totalUniqueCharacters: analysis.all_characters.length,
      knownCharacters: analysis.known_count,
      unknownCharacters: analysis.unknown_count,
      calculatedAt: new Date(),
    };

    if (existingRecord) {
      // Update existing record
      Object.assign(existingRecord, comprehensionData);
      return this.userSentenceKnowledgeRepository.save(existingRecord);
    } else {
      // Create new record with default SRS values
      const newRecord = this.userSentenceKnowledgeRepository.create({
        ...comprehensionData,
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
        firstSeenDate: new Date(),
      });
      return this.userSentenceKnowledgeRepository.save(newRecord);
    }
  }

  /**
   * Get comprehension percentage for a sentence, calculating if not cached
   */
  async getComprehensionPercentage(
    userId: number,
    sentenceId: number,
    sentenceText: string,
    maxAge: number = 24 * 60 * 60 * 1000, // 24 hours in ms
  ): Promise<number> {
    const existing = await this.findByUserAndSentence(userId, sentenceId);

    // Return cached value if it exists and is recent
    if (
      existing &&
      existing.calculatedAt &&
      Date.now() - existing.calculatedAt.getTime() < maxAge
    ) {
      return existing.comprehensionPercentage;
    }

    // Calculate and cache new value
    const updated = await this.calculateAndCacheComprehension(
      userId,
      sentenceId,
      sentenceText,
    );
    return updated.comprehensionPercentage;
  }

  /**
   * Check if a sentence meets comprehension threshold for a user
   */
  async isComprehensible(
    userId: number,
    sentenceId: number,
    sentenceText: string,
    minComprehension: number = 80,
  ): Promise<boolean> {
    const comprehension = await this.getComprehensionPercentage(
      userId,
      sentenceId,
      sentenceText,
    );
    return comprehension >= minComprehension;
  }

  /**
   * Get count of comprehensible sentences for a user
   */
  async getComprehensibleSentenceCount(
    userId: number,
    minComprehension: number = 80,
  ): Promise<number> {
    return this.userSentenceKnowledgeRepository.count({
      where: {
        userID: userId,
        comprehensionPercentage: MoreThanOrEqual(minComprehension),
      },
    });
  }

  /**
   * Update comprehension for sentences containing a specific character
   * (Called when user learns a new character)
   */
  async updateSentencesWithCharacter(
    userId: number,
    character: string,
  ): Promise<void> {
    // This would be implemented when we add the update logic
    // For now, just a placeholder
    console.log(
      `TODO: Update comprehension for sentences containing character: ${character} for user: ${userId}`,
    );
  }

  /**
   * Process a sentence review (for spaced repetition)
   */
  async processSentenceReview(
    userId: number,
    sentenceId: number,
    quality: number, // 0-5 quality rating
  ): Promise<UserSentenceKnowledge | null> {
    const knowledge = await this.findByUserAndSentence(userId, sentenceId);
    if (!knowledge) return null;

    // SM-2 algorithm implementation (similar to character knowledge)
    let newEF =
      knowledge.easinessFactor +
      (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    if (newEF < 1.3) newEF = 1.3;

    let newInterval: number;
    let newRepetitions: number;

    if (quality >= 3) {
      if (knowledge.repetitions === 0) {
        newInterval = 1;
      } else if (knowledge.repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(knowledge.interval * newEF);
      }
      newRepetitions = knowledge.repetitions + 1;
    } else {
      newInterval = 1;
      newRepetitions = 0;
    }

    const now = new Date();
    const nextReview = new Date();
    nextReview.setDate(now.getDate() + newInterval);

    knowledge.easinessFactor = newEF;
    knowledge.interval = newInterval;
    knowledge.repetitions = newRepetitions;
    knowledge.lastReviewDate = now;
    knowledge.nextReviewDate = nextReview;

    return this.userSentenceKnowledgeRepository.save(knowledge);
  }

  async excludeSentence(sentenceId: number, userId: number): Promise<void> {
    await this.userSentenceKnowledgeRepository.update(
      { sentenceID: sentenceId, userID: userId },
      { excluded: true },
    );
  }
}
