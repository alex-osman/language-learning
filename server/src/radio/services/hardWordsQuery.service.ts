import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Character } from '../../entities/character.entity';
import { UserCharacterKnowledge } from '../../entities/user-character-knowledge.entity';

@Injectable()
export class HardWordsQueryService {
  constructor(
    @InjectRepository(UserCharacterKnowledge)
    private userCharacterKnowledgeRepository: Repository<UserCharacterKnowledge>,
  ) {}

  async getHardest(count = 1, userId?: number): Promise<Character[]> {
    if (!userId) {
      throw new Error('User ID is required to get hardest characters');
    }

    // Get characters with user-specific spaced repetition data
    const userKnowledge = await this.userCharacterKnowledgeRepository.find({
      where: {
        userID: userId,
        movie: Not(IsNull()),
        easinessFactor: Not(IsNull()),
      },
      order: {
        easinessFactor: 'ASC', // Lower easiness = harder
      },
      take: count,
      relations: ['character'],
    });

    if (userKnowledge.length === 0) {
      throw new Error(
        'No characters in database with spaced repetition data for this user',
      );
    }

    return userKnowledge.map((uck) => {
      if (!uck.character) {
        throw new Error(`Character ${uck.characterID} not found`);
      }
      return uck.character;
    });
  }
}
