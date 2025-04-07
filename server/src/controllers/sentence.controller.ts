import { Controller, Get, Param } from '@nestjs/common';
import { SentenceService } from '../services/sentence.service';
import { SentenceDTO } from '../shared/interfaces/sentence.interface';

@Controller('api/sentences')
export class SentenceController {
  constructor(private readonly sentenceService: SentenceService) {}

  @Get()
  async getAllSentences(): Promise<SentenceDTO[]> {
    return this.sentenceService.findAll();
  }

  @Get(':id')
  async getSentenceById(@Param('id') id: number): Promise<SentenceDTO | null> {
    return this.sentenceService.findOne(id);
  }
}
