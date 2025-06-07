import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import {
  SentenceAnalyzerService,
  SentenceAnalysis,
} from '../services/sentence-analyzer.service';

interface AnalyzeSentenceRequest {
  text: string;
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

      return await this.sentenceAnalyzerService.analyzeSentence(request.text);
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
}
