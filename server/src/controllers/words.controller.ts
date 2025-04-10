import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { WordService } from '../services/word.service';
import { WordDTO } from '../shared/interfaces/data.interface';
import { Word } from '../entities/word.entity';

@Controller('api/words')
export class WordsController {
  constructor(private readonly wordService: WordService) {}

  @Get()
  getWords(): Promise<WordDTO[]> {
    return this.wordService.getAllWords();
  }

  @Get(':id')
  getWord(@Param('id') id: number): Promise<WordDTO | null> {
    return this.wordService.getOneWordDTO(id);
  }

  @Post()
  async createWord(@Body() word: Partial<Word>): Promise<Word> {
    return this.wordService.create(word);
  }

  @Put(':id')
  async updateWord(
    @Param('id') id: number,
    @Body() word: Partial<Word>,
  ): Promise<Word | null> {
    return this.wordService.update(id, word);
  }

  @Delete(':id')
  async deleteWord(@Param('id') id: number): Promise<void> {
    return this.wordService.delete(id);
  }
}
