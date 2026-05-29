import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserWordKnowledgeService } from '../services/user-word-knowledge.service';
import { UserID } from 'src/decorators/user.decorator';

interface ReviewRequest {
  quality: number;
}

interface FlashWordDTO {
  wordId: number;
  word: string;
  pinyin: string;
  definition: string;
  partOfSpeech?: string | null;
  lessonNumber?: number | null;
  easinessFactor: number;
  repetitions: number;
  interval: number;
  nextReviewDate?: Date;
}

@Controller('api/word-flashcards')
export class WordFlashcardController {
  constructor(
    private readonly userWordKnowledgeService: UserWordKnowledgeService,
  ) {}

  @Get('due')
  async getDueWords(@UserID() userId: number): Promise<FlashWordDTO[]> {
    const records = await this.userWordKnowledgeService.getDueWordsForUser(userId);
    return records
      .filter((r) => r.word != null)
      .map((r) => ({
        wordId: r.wordID,
        word: r.word!.word,
        pinyin: r.word!.pinyin,
        definition: r.word!.definition,
        partOfSpeech: r.word!.partOfSpeech,
        lessonNumber: r.word!.lessonNumber,
        easinessFactor: r.easinessFactor,
        repetitions: r.repetitions,
        interval: r.interval,
        nextReviewDate: r.nextReviewDate,
      }));
  }

  @Post(':wordId/review')
  async reviewWord(
    @Param('wordId') wordId: number,
    @Body() request: ReviewRequest,
    @UserID() userId: number,
  ): Promise<FlashWordDTO> {
    const updated = await this.userWordKnowledgeService.processReview(
      userId,
      wordId,
      request.quality,
    );
    return {
      wordId: updated.wordID,
      word: updated.word?.word ?? '',
      pinyin: updated.word?.pinyin ?? '',
      definition: updated.word?.definition ?? '',
      partOfSpeech: updated.word?.partOfSpeech,
      lessonNumber: updated.word?.lessonNumber,
      easinessFactor: updated.easinessFactor,
      repetitions: updated.repetitions,
      interval: updated.interval,
      nextReviewDate: updated.nextReviewDate,
    };
  }
}
