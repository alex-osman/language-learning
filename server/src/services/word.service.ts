import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from '../entities/word.entity';
import { WordDTO } from '@shared/interfaces/data.interface';

@Injectable()
export class WordService {
  constructor(
    @InjectRepository(Word)
    private wordRepository: Repository<Word>,
  ) {}

  async getAllWords(): Promise<WordDTO[]> {
    const words = await this.wordRepository.find({
      order: {
        frequencyRank: 'ASC',
        word: 'ASC',
      },
    });
    return words.map((word) => this.mapToDTO(word));
  }

  async findOne(id: number): Promise<Word | null> {
    return this.wordRepository.findOneOrFail({ where: { id } });
  }

  async getOneWordDTO(id: number): Promise<WordDTO | null> {
    const word = await this.findOne(id);
    if (!word) return null;
    return this.mapToDTO(word);
  }

  mapToDTO(word: Word): WordDTO {
    return {
      id: word.id,
      word: word.word,
      pinyin: word.pinyin,
      definition: word.definition,
      notes: word.notes,
      frequencyRank: word.frequencyRank,
      createdAt: word.createdAt,
    };
  }

  async findByWord(text: string): Promise<Word | null> {
    return this.wordRepository.findOne({ where: { word: text } });
  }

  async create(word: Partial<Word>): Promise<Word> {
    const newWord = this.wordRepository.create(word);
    return this.wordRepository.save(newWord);
  }

  async update(id: number, word: Partial<Word>): Promise<Word | null> {
    await this.wordRepository.update(id, word);
    return this.wordRepository.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.wordRepository.delete(id);
  }
}
