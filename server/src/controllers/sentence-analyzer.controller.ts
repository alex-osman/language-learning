import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { UserID } from 'src/decorators/user.decorator';
import {
  EnhancedSentenceAnalysis,
  SentenceAnalysis,
  SentenceAnalyzerService,
} from '../services/sentence-analyzer.service';

interface AnalyzeSentenceRequest {
  text: string;
}

interface AnalyzeSentencesRequest {
  texts: string[];
}

@Controller('api/sentence-analyzer')
export class SentenceAnalyzerController {
  private readonly logger = new Logger(SentenceAnalyzerController.name);

  constructor(
    private readonly sentenceAnalyzerService: SentenceAnalyzerService,
  ) {}

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
  ): Promise<SentenceAnalysis[]> {
    return [
      await this.sentenceAnalyzerService.analyzeSentenceId(
        parseInt(sentenceId),
        userId,
      ),
    ];
  }
}
