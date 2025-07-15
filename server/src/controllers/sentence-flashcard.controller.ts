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
import { SceneService } from 'src/services/scene.service';

interface ReviewRequest {
  quality: number; // 0-5 quality rating
}

@Controller('api/sentence-flashcards')
export class SentenceFlashcardController {
  constructor(
    private readonly sentenceFlashcardService: SentenceFlashcardService,
    private readonly sentenceService: SentenceService,
    private readonly sceneService: SceneService,
  ) {}

  /**
   * Get all sentences for a specific scene
   */
  @Get('scene/:sceneId')
  async getSentencesForScene(@Param('sceneId') sceneId: string): Promise<{
    title: string;
    assetUrl: string;
    sentences: SentenceDTO[];
    total: number;
  }> {
    const scene = await this.sceneService.findOne(parseInt(sceneId));
    if (!scene) {
      throw new NotFoundException('Scene not found');
    }
    const sentences = scene.sentences;
    const total = sentences.length;

    // Convert to DTOs
    return {
      title: scene.title,
      assetUrl: scene.assetUrl,
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
   * Get practice sentences for a scene
   * @param sceneId The scene ID
   * @param limit The number of sentences to retrieve for practice (optional)
   */
  @Get('scene/:sceneId/practice')
  async getPracticeSentences(
    @Param('sceneId') sceneId: string,
    @Query('limit') limit?: number,
  ): Promise<{ sentences: SentenceDTO[]; total: number }> {
    const sentences = await this.sentenceFlashcardService.getPracticeSentences(
      sceneId,
      limit,
    );
    const total =
      await this.sentenceFlashcardService.getTotalSentenceCount(sceneId);

    // Convert to DTOs
    return {
      sentences: sentences.map((sentence) =>
        this.sentenceService.toSentenceDTO(sentence),
      ),
      total,
    };
  }

  /**
   * Get scene progress statistics
   */
  @Get('scene/:sceneId/progress')
  async getSceneProgress(@Param('sceneId') sceneId: string) {
    return this.sentenceFlashcardService.getSceneProgress(sceneId);
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
