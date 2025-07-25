import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Sentence } from '../entities/sentence.entity';
import { SentenceDTO } from '../shared/interfaces/sentence.interface';
import { SRTEntry, MultiFormatSRTEntry } from './srt-parser.service';

@Injectable()
export class SentenceService {
  constructor(
    @InjectRepository(Sentence)
    private sentenceRepository: Repository<Sentence>,
  ) {}

  async getSentencesForCharacter(character: string): Promise<SentenceDTO[]> {
    const sentences = await this.sentenceRepository.find({
      where: { sentence: Like(`%${character}%`) },
    });
    return sentences.map((sentence) => this.toSentenceDTO(sentence));
  }

  async findAll(): Promise<SentenceDTO[]> {
    const sentences = await this.sentenceRepository.find();
    return sentences.map((sentence) => this.toSentenceDTO(sentence));
  }

  async findOne(id: number): Promise<SentenceDTO | null> {
    const sentence = await this.sentenceRepository.findOne({ where: { id } });
    if (!sentence) return null;
    return this.toSentenceDTO(sentence);
  }

  public toSentenceDTO(sentence: Sentence): SentenceDTO {
    // Calculate if the sentence is due for review
    const now = new Date();
    const farFutureThreshold = new Date();
    farFutureThreshold.setFullYear(farFutureThreshold.getFullYear() + 50);

    // Check if sentence has been practiced and is due for review
    const hasBeenPracticed =
      sentence.lastReviewDate && sentence.lastReviewDate < farFutureThreshold;
    const dueForReview =
      hasBeenPracticed && sentence.nextReviewDate
        ? sentence.nextReviewDate <= now
        : false;

    return {
      id: sentence.id,
      sentence: sentence.sentence,
      pinyin: sentence.pinyin,
      translation: sentence.translation,
      audioUrl: sentence.audioUrl,
      source: sentence.source,
      level: sentence.level,
      // Spaced repetition fields
      easinessFactor: sentence.easinessFactor,
      repetitions: sentence.repetitions,
      interval: sentence.interval,
      nextReviewDate: sentence.nextReviewDate,
      lastReviewDate: sentence.lastReviewDate,
      dueForReview,
      // Episode context (if available)
      episodeId: sentence.episode?.id,
      startMs: sentence.startMs,
      endMs: sentence.endMs,
    };
  }

  /**
   * Create sentences from SRT entries for a specific episode
   */
  async createSentencesFromSRT(
    srtEntries: SRTEntry[],
    episodeId: number,
  ): Promise<Sentence[]> {
    const sentences: Partial<Sentence>[] = srtEntries.map((entry) => ({
      sentence: entry.text,
      startMs: entry.startTime,
      endMs: entry.endTime,
      episode: { id: episodeId } as any, // TypeORM will handle the relation
      source: 'SRT_IMPORT',
      // Set default spaced repetition values
      easinessFactor: 2.5,
      repetitions: 0,
      interval: 1,
    }));

    const createdSentences = this.sentenceRepository.create(sentences);
    return this.sentenceRepository.save(createdSentences);
  }

  /**
   * Create sentences from multi-format SRT entries
   * Populates sentence (simplified Chinese), pinyin, and translation (English) fields
   */
  async createSentencesFromMultiFormatSRT(
    multiFormatEntries: MultiFormatSRTEntry[],
    episodeId: number,
  ): Promise<Sentence[]> {
    const sentences: Partial<Sentence>[] = multiFormatEntries.map((entry) => ({
      sentence: entry.simplifiedChinese, // Simplified Chinese text
      pinyin: entry.pinyin, // Pinyin romanization
      translation: entry.english, // English translation
      startMs: entry.startTime,
      endMs: entry.endTime,
      episode: { id: episodeId } as any,
      source: 'MULTI_FORMAT_SRT_IMPORT',
      easinessFactor: 2.5,
      repetitions: 0,
      interval: 1,
    }));

    const createdSentences = this.sentenceRepository.create(sentences);
    return this.sentenceRepository.save(createdSentences);
  }

  /**
   * Check if episode has existing sentences to avoid duplicates
   */
  async countSentencesForEpisode(episodeId: number): Promise<number> {
    return this.sentenceRepository.count({
      where: { episode: { id: episodeId } },
    });
  }

  /**
   * Delete all sentences for an episode (useful for re-importing)
   */
  async deleteSentencesForEpisode(episodeId: number): Promise<void> {
    await this.sentenceRepository.delete({
      episode: { id: episodeId },
    });
  }
}
