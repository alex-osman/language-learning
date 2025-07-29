import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEpisodeKnowledge } from '../entities/user-episode-knowledge.entity';
import { Episode } from '../entities/episode.entity';
import { SentenceAnalyzerService } from './sentence-analyzer.service';

@Injectable()
export class UserEpisodeKnowledgeService {
  constructor(
    @InjectRepository(UserEpisodeKnowledge)
    private userEpisodeKnowledgeRepository: Repository<UserEpisodeKnowledge>,
    @InjectRepository(Episode)
    private episodeRepository: Repository<Episode>,
    private sentenceAnalyzerService: SentenceAnalyzerService,
  ) {}

  async findByUserAndEpisode(
    userId: number,
    episodeId: number,
  ): Promise<UserEpisodeKnowledge | null> {
    return this.userEpisodeKnowledgeRepository.findOne({
      where: { userID: userId, episodeID: episodeId },
    });
  }

  async calculateAndCacheComprehension(
    userId: number,
    episodeId: number,
    maxAge = 24 * 60 * 60 * 1000, // 24h
  ): Promise<UserEpisodeKnowledge> {
    const existing = await this.findByUserAndEpisode(userId, episodeId);
    if (
      existing &&
      existing.calculatedAt &&
      Date.now() - existing.calculatedAt.getTime() < maxAge
    ) {
      return existing;
    }

    const episode = await this.episodeRepository.findOne({
      where: { id: episodeId },
      relations: ['sentences'],
    });
    if (!episode) throw new Error('Episode not found');

    const analyses = await this.sentenceAnalyzerService.analyzeSentenceIds(
      episode.sentences.map((s) => s.id),
      userId,
    );

    const knownCount = analyses.reduce((acc, cur) => acc + cur.known_count, 0);
    const totalCount = analyses.reduce(
      (acc, cur) => acc + cur.total_characters,
      0,
    );
    const comprehensionPercentage =
      totalCount > 0 ? (knownCount / totalCount) * 100 : 0;

    const recordData = {
      userID: userId,
      episodeID: episodeId,
      comprehensionPercentage: Math.round(comprehensionPercentage),
      totalUniqueCharacters: totalCount,
      knownCharacters: knownCount,
      unknownCharacters: totalCount - knownCount,
      calculatedAt: new Date(),
    } as Partial<UserEpisodeKnowledge>;

    if (existing) {
      Object.assign(existing, recordData);
      return this.userEpisodeKnowledgeRepository.save(existing);
    }

    const newRecord = this.userEpisodeKnowledgeRepository.create({
      ...recordData,
      easinessFactor: 2.5,
      repetitions: 0,
      interval: 0,
      firstSeenDate: new Date(),
    });
    return this.userEpisodeKnowledgeRepository.save(newRecord);
  }

  async getComprehensionPercentage(
    userId: number,
    episodeId: number,
  ): Promise<number> {
    const record = await this.calculateAndCacheComprehension(userId, episodeId);
    return record.comprehensionPercentage;
  }
}
