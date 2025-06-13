import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Character } from '../../entities/character.entity';

@Injectable()
export class HardWordsQueryService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
  ) {}

  async getHardest(count = 1): Promise<Character[]> {
    // Changed default from 10 to 1
    // Get characters with spaced repetition data (like flashcard service does)
    const pool = await this.characterRepository.find({
      where: {
        movie: Not(IsNull()),
        easinessFactor: Not(IsNull()),
      },
      order: {
        easinessFactor: 'ASC', // Lower easiness = harder
      },
      take: count,
    });

    if (pool.length === 0) {
      throw new Error('No characters in database with spaced repetition data');
    }

    return pool;
  }
}
