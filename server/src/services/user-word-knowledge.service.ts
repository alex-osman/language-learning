import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { UserWordKnowledge } from '../entities/user-word-knowledge.entity';
import { WordKnowledgeStatus } from '../shared/interfaces/data.interface';

@Injectable()
export class UserWordKnowledgeService {
  constructor(
    @InjectRepository(UserWordKnowledge)
    private repo: Repository<UserWordKnowledge>,
  ) {}

  async findByUser(userId: number): Promise<UserWordKnowledge[]> {
    return this.repo.find({ where: { userID: userId } });
  }

  async getDueWordsForUser(userId: number): Promise<UserWordKnowledge[]> {
    const now = new Date();
    const records = await this.repo.find({
      where: [
        { userID: userId, nextReviewDate: IsNull() },
        { userID: userId, nextReviewDate: LessThanOrEqual(now) },
      ],
      relations: ['word'],
    });
    return records.filter((r) => r.firstSeenDate != null);
  }

  async findByUserAndWord(userId: number, wordId: number): Promise<UserWordKnowledge | null> {
    return this.repo.findOne({ where: { userID: userId, wordID: wordId } });
  }

  async markAsSeen(userId: number, wordId: number): Promise<UserWordKnowledge> {
    let record = await this.findByUserAndWord(userId, wordId);
    if (!record) {
      record = this.repo.create({ userID: userId, wordID: wordId });
    }
    record.firstSeenDate = record.firstSeenDate ?? new Date();
    record.lastReviewDate = undefined;
    record.repetitions = 0;
    record.easinessFactor = 2.5;
    record.interval = 0;
    return this.repo.save(record);
  }

  async markAsKnown(userId: number, wordId: number): Promise<UserWordKnowledge> {
    let record = await this.findByUserAndWord(userId, wordId);
    const now = new Date();
    if (!record) {
      record = this.repo.create({ userID: userId, wordID: wordId });
    }
    record.firstSeenDate = record.firstSeenDate ?? now;
    record.lastReviewDate = now;
    record.repetitions = 5;
    record.easinessFactor = 2.5;
    record.interval = 30;
    return this.repo.save(record);
  }

  async markAllAsSeen(userId: number, wordIds: number[]): Promise<void> {
    const existing = await this.repo.find({
      where: wordIds.map((wordID) => ({ userID: userId, wordID })),
    });
    const existingMap = new Map(existing.map((r) => [r.wordID, r]));

    const toSave: UserWordKnowledge[] = [];
    for (const wordId of wordIds) {
      const record = existingMap.get(wordId);
      if (!record) {
        toSave.push(this.repo.create({
          userID: userId,
          wordID: wordId,
          firstSeenDate: new Date(),
          easinessFactor: 2.5,
          repetitions: 0,
          interval: 0,
        }));
      } else if (!record.firstSeenDate) {
        record.firstSeenDate = new Date();
        toSave.push(record);
      }
      // already seen/learning/learned → skip
    }
    if (toSave.length > 0) await this.repo.save(toSave);
  }

  async resetKnowledge(userId: number, wordId: number): Promise<void> {
    await this.repo.delete({ userID: userId, wordID: wordId });
  }

  async markSeen(userId: number, wordId: number): Promise<UserWordKnowledge> {
    let record = await this.findByUserAndWord(userId, wordId);
    if (!record) {
      record = this.repo.create({
        userID: userId,
        wordID: wordId,
        firstSeenDate: new Date(),
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
      });
    } else if (!record.firstSeenDate) {
      record.firstSeenDate = new Date();
    }
    return this.repo.save(record);
  }

  async processReview(userId: number, wordId: number, quality: number): Promise<UserWordKnowledge> {
    let record = await this.findByUserAndWord(userId, wordId);
    if (!record) {
      record = this.repo.create({
        userID: userId,
        wordID: wordId,
        firstSeenDate: new Date(),
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
      });
    }

    const { newEF, newInterval, newRepetitions } = this.calculateSM2(
      record.easinessFactor,
      record.repetitions,
      record.interval,
      quality,
    );

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    record.easinessFactor = newEF;
    record.repetitions = newRepetitions;
    record.interval = newInterval;
    record.lastReviewDate = new Date();
    record.nextReviewDate = nextReviewDate;

    return this.repo.save(record);
  }

  getStatus(record: UserWordKnowledge | null | undefined): WordKnowledgeStatus {
    if (!record || !record.firstSeenDate) return 'unknown';
    if (!record.lastReviewDate) return 'seen';
    if (record.repetitions >= 3 && record.easinessFactor >= 2.0) return 'learned';
    return 'learning';
  }

  async getStatusMap(userId: number, wordIds: number[]): Promise<Map<number, WordKnowledgeStatus>> {
    if (wordIds.length === 0) return new Map();
    const records = await this.repo
      .createQueryBuilder('uwk')
      .where('uwk.userID = :userId AND uwk.wordID IN (:...wordIds)', { userId, wordIds })
      .getMany();
    const map = new Map<number, WordKnowledgeStatus>();
    for (const r of records) {
      map.set(r.wordID, this.getStatus(r));
    }
    return map;
  }

  private calculateSM2(
    ef: number,
    repetitions: number,
    interval: number,
    quality: number,
  ): { newEF: number; newInterval: number; newRepetitions: number } {
    let newEF = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEF = Math.max(1.3, newEF);

    let newInterval: number;
    let newRepetitions: number;

    if (quality < 3) {
      newRepetitions = 0;
      newInterval = 1;
    } else {
      newRepetitions = repetitions + 1;
      if (newRepetitions === 1) newInterval = 1;
      else if (newRepetitions === 2) newInterval = 6;
      else newInterval = Math.round(interval * newEF);
    }

    return { newEF, newInterval, newRepetitions };
  }
}
