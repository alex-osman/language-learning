import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sentence } from '../entities/sentence.entity';
import { SentenceDTO } from '../shared/interfaces/sentence.interface';

@Injectable()
export class SentenceService {
  constructor(
    @InjectRepository(Sentence)
    private sentenceRepository: Repository<Sentence>,
  ) {}

  async findAll(): Promise<SentenceDTO[]> {
    const sentences = await this.sentenceRepository.find();
    return sentences.map((sentence) => this.toSentenceDTO(sentence));
  }

  async findOne(id: number): Promise<SentenceDTO | null> {
    const sentence = await this.sentenceRepository.findOne({ where: { id } });
    if (!sentence) return null;
    return this.toSentenceDTO(sentence);
  }

  private toSentenceDTO(sentence: Sentence): SentenceDTO {
    // Calculate if the sentence is due for review
    const now = new Date();
    const dueForReview = sentence.nextReviewDate
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
    };
  }
}
