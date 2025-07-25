import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { SentenceFlashcardService } from '../services/sentence-flashcard.service';
import { SentenceService } from '../services/sentence.service';
import { SentenceDTO } from '../shared/interfaces/sentence.interface';
import { EpisodeService } from '../services/episode.service';

interface ReviewRequest {
  quality: number; // 0-5 quality rating
}

@Controller('api/sentence-flashcards')
export class SentenceFlashcardController {
  constructor(
    private readonly sentenceFlashcardService: SentenceFlashcardService,
    private readonly sentenceService: SentenceService,
    private readonly episodeService: EpisodeService,
  ) {}

  /**
   * Get all sentences for a specific episode
   */
  @Get('episode/:episodeId')
  async getSentencesForEpisode(@Param('episodeId') episodeId: string): Promise<{
    title: string;
    assetUrl: string;
    sentences: SentenceDTO[];
    total: number;
  }> {
    const episode = await this.episodeService.findOne(parseInt(episodeId));
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }
    const sentences = episode.sentences || [];
    const total = sentences.length;

    // Convert to DTOs
    return {
      title: episode.title,
      assetUrl: episode.assetUrl,
      sentences: sentences.map((s) => ({
        id: s.id,
        sentence: s.sentence,
        pinyin: s.pinyin,
        translation: s.translation,
        audioUrl: s.audioUrl,
        source: s.source,
        level: s.level,
        easinessFactor: s.easinessFactor,
        repetitions: s.repetitions,
        interval: s.interval,
        startMs: s.startMs,
        endMs: s.endMs,
        dueForReview: false,
      })),
      total,
    };
  }

  /**
   * Get practice sentences for an episode
   * @param episodeId The episode ID
   * @param limit The number of sentences to retrieve for practice (optional)
   */
  @Get('episode/:episodeId/practice')
  async getPracticeSentences(
    @Param('episodeId') episodeId: string,
    @Query('limit') limit?: number,
  ): Promise<{ sentences: SentenceDTO[]; total: number }> {
    const sentences = await this.sentenceFlashcardService.getPracticeSentences(
      parseInt(episodeId),
      limit,
    );
    const total =
      await this.sentenceFlashcardService.getTotalSentenceCount(parseInt(episodeId));

    // Convert to DTOs
    return {
      sentences: sentences.map((sentence) =>
        this.sentenceService.toSentenceDTO(sentence),
      ),
      total,
    };
  }

  /**
   * Get episode progress statistics
   */
  @Get('episode/:episodeId/progress')
  async getEpisodeProgress(@Param('episodeId') episodeId: string) {
    return this.sentenceFlashcardService.getEpisodeProgress(parseInt(episodeId));
  }

  /**
   * Process a review for a sentence
   */
  @Post(':id/review')
  async reviewSentence(
    @Param('id') id: number,
    @Body() request: ReviewRequest,
  ): Promise<SentenceDTO> {
    const updatedSentence = await this.sentenceFlashcardService.processReview(
      id,
      request.quality,
    );
    return this.sentenceService.toSentenceDTO(updatedSentence);
  }

  /**
   * Start learning a new sentence
   */
  @Post(':id/learn')
  async startLearning(@Param('id') id: number): Promise<SentenceDTO> {
    const sentence = await this.sentenceFlashcardService.startLearning(id);
    return this.sentenceService.toSentenceDTO(sentence);
  }

  /**
   * Reset learning progress for a sentence
   */
  @Post(':id/reset')
  async resetLearning(@Param('id') id: number): Promise<SentenceDTO> {
    const sentence = await this.sentenceFlashcardService.resetLearning(id);
    return this.sentenceService.toSentenceDTO(sentence);
  }
}
