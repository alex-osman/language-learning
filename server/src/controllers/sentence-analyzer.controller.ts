import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserID } from 'src/decorators/user.decorator';
import {
  EnhancedSentenceAnalysis,
  SentenceAnalysis,
  UserSentenceKnowledgeDTO,
  SentenceAnalyzerService,
} from '../services/sentence-analyzer.service';
import { UserSentenceKnowledgeService } from '../services/user-sentence-knowledge.service';
import { SentenceService } from '../services/sentence.service';

interface AnalyzeSentenceRequest {
  text: string;
}

interface AnalyzeSentencesRequest {
  texts: string[];
}

@Controller('api/sentence-analyzer')
export class SentenceAnalyzerController {
  private readonly logger = new Logger(SentenceAnalyzerController.name);

  // Default cache age: 24 hours in milliseconds
  private readonly DEFAULT_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly sentenceAnalyzerService: SentenceAnalyzerService,
    private readonly userSentenceKnowledgeService: UserSentenceKnowledgeService,
    private readonly sentenceService: SentenceService,
  ) {}

  /**
   * Helper method to check if UserSentenceKnowledge data is stale
   */
  private isKnowledgeStale(
    knowledge: any,
    maxAge: number = this.DEFAULT_CACHE_AGE,
  ): boolean {
    return (
      !knowledge?.calculatedAt ||
      Date.now() - knowledge.calculatedAt.getTime() >= maxAge
    );
  }

  @Post('analyze')
  async analyzeSentence(
    @Body() request: AnalyzeSentenceRequest,
    @UserID() userId: number,
  ): Promise<SentenceAnalysis> {
    try {
      if (!request.text) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Text is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.sentenceAnalyzerService.analyzeSentence(
        request.text,
        userId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to analyze sentence:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to analyze sentence',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze-enhanced')
  async analyzeTextWithKnowledgeStatus(
    @Body() request: AnalyzeSentenceRequest,
    @UserID() userId: number,
  ): Promise<EnhancedSentenceAnalysis> {
    try {
      if (!request.text) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Text is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.sentenceAnalyzerService.analyzeTextWithKnowledgeStatus(
        request.text,
        userId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to analyze text with knowledge status:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to analyze text with knowledge status',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze-batch')
  async analyzeSentences(
    @Body() request: AnalyzeSentencesRequest,
    @UserID() userId: number,
  ): Promise<SentenceAnalysis[]> {
    try {
      if (
        !request.texts ||
        !Array.isArray(request.texts) ||
        request.texts.length === 0
      ) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Texts array is required and must not be empty',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.sentenceAnalyzerService.analyzeSentences(
        request.texts,
        userId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to analyze sentences:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to analyze sentences',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze-batch-enhanced')
  async analyzeSentencesWithKnowledgeStatus(
    @Body() request: AnalyzeSentencesRequest,
    @UserID() userId: number,
  ): Promise<EnhancedSentenceAnalysis[]> {
    try {
      if (
        !request.texts ||
        !Array.isArray(request.texts) ||
        request.texts.length === 0
      ) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Texts array is required and must not be empty',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.sentenceAnalyzerService.analyzeSentencesWithKnowledgeStatus(
        request.texts,
        userId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to analyze sentences with knowledge status:`,
        error,
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to analyze sentences with knowledge status',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze-sentence/:sentenceId')
  async analyzeSentenceId(
    @Param('sentenceId') sentenceId: string,
    @UserID() userId: number,
    @Query('force') forceRecalculate?: string,
  ): Promise<SentenceAnalysis[]> {
    try {
      this.logger.log(
        `Analyzing sentence ${sentenceId} for user ${userId} with forceRecalculate: ${forceRecalculate}`,
      );
      const sentenceIdNum = parseInt(sentenceId);
      const shouldForce = forceRecalculate === 'true';

      // Check for cached data if not forcing recalculation
      if (!shouldForce) {
        const existingKnowledge =
          await this.userSentenceKnowledgeService.findByUserAndSentence(
            userId,
            sentenceIdNum,
          );

        // Use cached data if it's not stale
        if (!this.isKnowledgeStale(existingKnowledge)) {
          // Get sentence text for analysis structure
          const sentence =
            await this.sentenceService.getSentenceById(sentenceIdNum);
          const analysis = await this.sentenceAnalyzerService.analyzeSentence(
            sentence.sentence,
            userId,
          );
          // Use cached comprehension percentage
          analysis.known_percent = existingKnowledge!.comprehensionPercentage;

          return [analysis];
        }
      }

      // Fall back to full analysis
      return [
        await this.sentenceAnalyzerService.analyzeSentenceId(
          sentenceIdNum,
          userId,
        ),
      ];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to analyze sentence ${sentenceId}:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to analyze sentence',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze-episode/:episodeId')
  async analyzeEpisode(
    @Param('episodeId') episodeId: string,
    @UserID() userId: number,
  ): Promise<UserSentenceKnowledgeDTO[]> {
    return await this.sentenceAnalyzerService.analyzeEpisode(
      parseInt(episodeId),
      userId,
    );
  }

  @Post('analyze-sentenceIds')
  async analyzeSentenceIds(
    @Body() request: { sentenceIds: number[] },
    @UserID() userId: number,
    @Query('force') forceRecalculate?: string,
  ): Promise<SentenceAnalysis[]> {
    try {
      this.logger.log(
        `Analyzing sentence IDs ${request.sentenceIds} for user ${userId} with forceRecalculate: ${forceRecalculate}`,
      );
      if (
        !request.sentenceIds ||
        !Array.isArray(request.sentenceIds) ||
        request.sentenceIds.length === 0
      ) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Sentence IDs array is required and must not be empty',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const shouldForce = forceRecalculate === 'true';

      if (!shouldForce) {
        // Process each sentence individually to maintain order
        const results: SentenceAnalysis[] = [];

        for (const sentenceId of request.sentenceIds) {
          const existingKnowledge =
            await this.userSentenceKnowledgeService.findByUserAndSentence(
              userId,
              sentenceId,
            );

          this.logger.log(
            `Sentence ${sentenceId} for user ${userId} has knowledge: ${existingKnowledge}`,
          );
          // Use cached data if it's not stale
          if (!this.isKnowledgeStale(existingKnowledge)) {
            this.logger.log(
              `Sentence ${sentenceId} for user ${userId} is not stale`,
            );
            // Use cached data
            const sentence =
              await this.sentenceService.getSentenceById(sentenceId);
            const analysis = await this.sentenceAnalyzerService.analyzeSentence(
              sentence.sentence,
              userId,
            );
            analysis.known_percent = existingKnowledge!.comprehensionPercentage;
            results.push(analysis);
          } else {
            this.logger.log(
              `Sentence ${sentenceId} for user ${userId} is stale`,
            );
            // Perform fresh analysis
            const analysis =
              await this.sentenceAnalyzerService.analyzeSentenceId(
                sentenceId,
                userId,
              );
            results.push(analysis);
          }
        }

        return results;
      }

      // Force recalculation for all sentences
      return await this.sentenceAnalyzerService.analyzeSentenceIds(
        request.sentenceIds,
        userId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to analyze sentence IDs:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to analyze sentence IDs',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
