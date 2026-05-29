import { Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { LessonService } from '../services/lesson.service';
import { UserWordKnowledgeService } from '../services/user-word-knowledge.service';
import { UserID } from 'src/decorators/user.decorator';
import { LessonDetailDTO, LessonSummaryDTO } from '../shared/interfaces/data.interface';

@Controller('api/lessons')
export class LessonsController {
  constructor(
    private readonly lessonService: LessonService,
    private readonly userWordKnowledgeService: UserWordKnowledgeService,
  ) {}

  @Get()
  getLessons(@UserID() userId: number): Promise<LessonSummaryDTO[]> {
    return this.lessonService.getLessonsSummary(userId);
  }

  @Post(':lessonNumber/auto-mark-learned')
  @HttpCode(200)
  autoMarkLearned(
    @UserID() userId: number,
    @Param('lessonNumber', ParseIntPipe) lessonNumber: number,
  ): Promise<number[]> {
    return this.lessonService.autoMarkLearnedByChars(userId, lessonNumber);
  }

  @Post(':lessonNumber/mark-all-seen')
  @HttpCode(204)
  async markAllSeen(
    @UserID() userId: number,
    @Param('lessonNumber', ParseIntPipe) lessonNumber: number,
  ) {
    const detail = await this.lessonService.getLessonDetail(userId, lessonNumber);
    const wordIds = detail.words.map((w) => w.id);
    await this.userWordKnowledgeService.markAllAsSeen(userId, wordIds);
  }

  @Post('words/:wordId/seen')
  @HttpCode(200)
  markSeen(
    @UserID() userId: number,
    @Param('wordId', ParseIntPipe) wordId: number,
  ) {
    return this.userWordKnowledgeService.markAsSeen(userId, wordId);
  }

  @Post('words/:wordId/known')
  @HttpCode(200)
  markKnown(
    @UserID() userId: number,
    @Param('wordId', ParseIntPipe) wordId: number,
  ) {
    return this.userWordKnowledgeService.markAsKnown(userId, wordId);
  }

  @Delete('words/:wordId/known')
  @HttpCode(204)
  async resetKnown(
    @UserID() userId: number,
    @Param('wordId', ParseIntPipe) wordId: number,
  ) {
    await this.userWordKnowledgeService.resetKnowledge(userId, wordId);
  }

  @Get(':lessonNumber')
  getLesson(
    @UserID() userId: number,
    @Param('lessonNumber', ParseIntPipe) lessonNumber: number,
  ): Promise<LessonDetailDTO> {
    return this.lessonService.getLessonDetail(userId, lessonNumber);
  }
}
