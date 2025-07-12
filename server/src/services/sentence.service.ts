import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Sentence } from '../entities/sentence.entity';
import { SentenceDTO } from '../shared/interfaces/sentence.interface';

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
      // Scene context (if available)
      sceneId: sentence.scene?.id?.toString(),
      startMs: 0, // TODO: Add startMs to sentence entity if needed
      endMs: 0, // TODO: Add endMs to sentence entity if needed
    };
  }
}
