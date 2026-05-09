import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEpisodeKnowledge } from '../entities/user-episode-knowledge.entity';
import { Episode } from '../entities/episode.entity';
import { Character } from '../entities/character.entity';
import {
  CharacterKnowledgeStatus,
  UserCharacterKnowledgeService,
} from './user-character-knowledge.service';

@Injectable()
export class UserEpisodeKnowledgeService {
  constructor(
    @InjectRepository(UserEpisodeKnowledge)
    private userEpisodeKnowledgeRepository: Repository<UserEpisodeKnowledge>,
    @InjectRepository(Episode)
    private episodeRepository: Repository<Episode>,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    private userCharacterKnowledgeService: UserCharacterKnowledgeService,
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

    // Count total character occurrences and known occurrences.
    // "Known" = seen, learning, or learned (anything with a firstSeenDate or lastReviewDate).
    // Denominator = total char occurrences (non-unique) so common chars like 的 count fully.
    const allText = episode.sentences.map((s) => s.sentence).join('');
    const chars = allText.replace(/[^\u4e00-\u9fff]/g, '').split('');

    const charCounts = new Map<string, number>();
    for (const c of chars) {
      charCounts.set(c, (charCounts.get(c) || 0) + 1);
    }

    const totalOccurrences = chars.length;
    const uniqueChars = Array.from(charCounts.keys());

    // Batch fetch character DB records
    const charRecords = await Promise.all(
      uniqueChars.map((c) =>
        this.characterRepository.findOne({ where: { character: c } }),
      ),
    );

    // For each unique char, check knowledge status and multiply by occurrence count
    let knownOccurrences = 0;
    await Promise.all(
      uniqueChars.map(async (char, i) => {
        const charRecord = charRecords[i];
        if (!charRecord) return;
        const status =
          await this.userCharacterKnowledgeService.getCharacterKnowledgeStatus(
            userId,
            charRecord.id,
          );
        if (status !== CharacterKnowledgeStatus.UNKNOWN) {
          knownOccurrences += charCounts.get(char) || 0;
        }
      }),
    );

    const comprehensionPercentage =
      totalOccurrences > 0
        ? Math.round((knownOccurrences / totalOccurrences) * 100)
        : 0;

    const recordData = {
      userID: userId,
      episodeID: episodeId,
      comprehensionPercentage,
      totalUniqueCharacters: totalOccurrences,
      knownCharacters: knownOccurrences,
      unknownCharacters: totalOccurrences - knownOccurrences,
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
