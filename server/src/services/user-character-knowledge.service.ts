import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, MoreThan, LessThanOrEqual } from 'typeorm';
import { Character } from '../entities/character.entity';
import { UserCharacterKnowledge } from '../entities/user-character-knowledge.entity';
import { CharacterDTO } from '@shared/interfaces/data.interface';

@Injectable()
export class UserCharacterKnowledgeService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(UserCharacterKnowledge)
    private userCharacterKnowledgeRepository: Repository<UserCharacterKnowledge>,
  ) {}

  async findAllCharactersWithKnowledge(
    userId: number,
  ): Promise<UserCharacterKnowledge[]> {
    return this.userCharacterKnowledgeRepository.find({
      where: { userID: userId },
      relations: ['character'],
    });
  }

  async findByUserAndCharacter(
    userId: number,
    characterId: number,
  ): Promise<UserCharacterKnowledge | null> {
    return this.userCharacterKnowledgeRepository.findOne({
      where: { userID: userId, characterID: characterId },
    });
  }

  async createForUser(
    userId: number,
    characterId: number,
  ): Promise<UserCharacterKnowledge> {
    const userKnowledge = this.userCharacterKnowledgeRepository.create({
      userID: userId,
      characterID: characterId,
      easinessFactor: 2.5,
      repetitions: 0,
      interval: 0,
    });
    return this.userCharacterKnowledgeRepository.save(userKnowledge);
  }

  async updateForUser(
    userId: number,
    characterId: number,
    updates: Partial<UserCharacterKnowledge>,
  ): Promise<UserCharacterKnowledge | null> {
    const result = await this.userCharacterKnowledgeRepository.update(
      { userID: userId, characterID: characterId },
      updates,
    );
    if (result.affected === 0) {
      return null;
    }
    return this.findByUserAndCharacter(userId, characterId);
  }

  async saveMovieForUser(
    userId: number,
    characterId: number,
    movie: string,
    imgUrl?: string,
  ): Promise<Character> {
    let userKnowledge = await this.findByUserAndCharacter(userId, characterId);

    if (!userKnowledge) {
      userKnowledge = await this.createForUser(userId, characterId);
    }

    await this.updateForUser(userId, characterId, {
      movie,
      imgUrl,
      learnedDate: new Date(),
    });

    // Return the character with merged user data
    const character = await this.characterRepository.findOne({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    return this.mergeCharacterWithUserData(character, userKnowledge);
  }

  async getDueCardsForUser(userId: number): Promise<Character[]> {
    const now = new Date();
    const dueUserKnowledge = await this.userCharacterKnowledgeRepository.find({
      where: [
        {
          userID: userId,
          nextReviewDate: LessThanOrEqual(now),
        },
        {
          userID: userId,
          nextReviewDate: IsNull(),
        },
      ],
      relations: ['character'],
    });

    return dueUserKnowledge.map((uck) => {
      if (!uck.character) {
        throw new Error(`Character ${uck.characterID} not found`);
      }
      return this.mergeCharacterWithUserData(uck.character, uck);
    });
  }

  async getPracticeCardsForUser(
    userId: number,
    limit: number = 10,
  ): Promise<Character[]> {
    // Get characters that the user has started learning
    const userKnowledge = await this.userCharacterKnowledgeRepository.find({
      where: { userID: userId },
      relations: ['character'],
      take: limit,
      order: { lastReviewDate: 'ASC' },
    });

    return userKnowledge.map((uck) => {
      if (!uck.character) {
        throw new Error(`Character ${uck.characterID} not found`);
      }
      return this.mergeCharacterWithUserData(uck.character, uck);
    });
  }

  async processReviewForUser(
    userId: number,
    characterId: number,
    quality: number,
  ): Promise<Character> {
    let userKnowledge = await this.findByUserAndCharacter(userId, characterId);

    if (!userKnowledge) {
      userKnowledge = await this.createForUser(userId, characterId);
    }

    const { newEF, newInterval, newRepetitions } = this.calculateSM2(
      userKnowledge.easinessFactor,
      userKnowledge.repetitions,
      userKnowledge.interval,
      quality,
    );

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    await this.updateForUser(userId, characterId, {
      easinessFactor: newEF,
      repetitions: newRepetitions,
      interval: newInterval,
      lastReviewDate: new Date(),
      nextReviewDate,
    });

    const character = await this.characterRepository.findOne({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    return this.mergeCharacterWithUserData(character, {
      ...userKnowledge,
      easinessFactor: newEF,
      repetitions: newRepetitions,
      interval: newInterval,
      lastReviewDate: new Date(),
      nextReviewDate,
    });
  }

  async startLearningForUser(
    userId: number,
    characterId: number,
  ): Promise<Character> {
    let userKnowledge = await this.findByUserAndCharacter(userId, characterId);

    if (!userKnowledge) {
      userKnowledge = await this.createForUser(userId, characterId);
    }

    const character = await this.characterRepository.findOne({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    return this.mergeCharacterWithUserData(character, userKnowledge);
  }

  async resetLearningForUser(
    userId: number,
    characterId: number,
  ): Promise<Character> {
    await this.updateForUser(userId, characterId, {
      easinessFactor: 2.5,
      repetitions: 0,
      interval: 0,
      lastReviewDate: undefined,
      nextReviewDate: undefined,
      learnedDate: undefined,
    });

    const character = await this.characterRepository.findOne({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    // Create a minimal user knowledge object for merging
    const resetUserKnowledge: Partial<UserCharacterKnowledge> = {
      userID: userId,
      characterID: characterId,
      easinessFactor: 2.5,
      repetitions: 0,
      interval: 0,
      lastReviewDate: undefined,
      nextReviewDate: undefined,
      learnedDate: undefined,
      movie: undefined,
      imgUrl: undefined,
    };

    return this.mergeCharacterWithUserData(
      character,
      resetUserKnowledge as UserCharacterKnowledge,
    );
  }

  async hasUserReviewed(userId: number, characterId: number): Promise<boolean> {
    const userKnowledge = await this.findByUserAndCharacter(
      userId,
      characterId,
    );
    return userKnowledge !== null && userKnowledge.lastReviewDate !== null;
  }

  async getNextCharacterWithoutMovie(
    userId: number,
  ): Promise<Character | null> {
    // Use a single query with LEFT JOIN to find the first character without a movie
    const result = await this.characterRepository
      .createQueryBuilder('character')
      .leftJoin(
        'user_character_knowledge',
        'uck',
        'uck.characterID = character.id AND uck.userID = :userId',
        { userId },
      )
      .where('uck.movie IS NULL OR uck.id IS NULL')
      .orderBy('character.id', 'ASC')
      .limit(1)
      .getOne();

    if (!result) {
      return null;
    }

    // Get the user knowledge for this character (if it exists)
    const userKnowledge = await this.findByUserAndCharacter(userId, result.id);
    return this.mergeCharacterWithUserData(result, userKnowledge);
  }

  async getAllCharacterDTOs(userId: number): Promise<Character[]> {
    const allCharacters = await this.characterRepository.find({
      order: { id: 'DESC' },
    });

    const userKnowledgeMap = new Map<number, UserCharacterKnowledge>();
    const userKnowledge = await this.userCharacterKnowledgeRepository.find({
      where: { userID: userId },
    });

    userKnowledge.forEach((uck) => {
      userKnowledgeMap.set(uck.characterID, uck);
    });

    return allCharacters.map((character) => {
      const userData = userKnowledgeMap.get(character.id);
      return this.mergeCharacterWithUserData(character, userData);
    });
  }

  private mergeCharacterWithUserData(
    character: Character,
    userKnowledge?: UserCharacterKnowledge | null,
  ): Character {
    if (!userKnowledge) {
      return character;
    }

    return {
      ...character,
      movie: userKnowledge.movie || null,
      imgUrl: userKnowledge.imgUrl || null,
      learnedDate: userKnowledge.learnedDate || null,
      easinessFactor: userKnowledge.easinessFactor ?? 2.5,
      repetitions: userKnowledge.repetitions ?? 0,
      interval: userKnowledge.interval ?? 0,
      nextReviewDate: userKnowledge.nextReviewDate || null,
      lastReviewDate: userKnowledge.lastReviewDate || null,
    } as Character;
  }

  private calculateSM2(
    ef: number,
    repetitions: number,
    interval: number,
    quality: number,
  ): { newEF: number; newInterval: number; newRepetitions: number } {
    let newEF = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEF = Math.max(1.3, newEF);

    let newInterval: number;
    let newRepetitions: number;

    if (quality < 3) {
      newRepetitions = 0;
      newInterval = 1;
    } else {
      newRepetitions = repetitions + 1;
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * newEF);
      }
    }

    return { newEF, newInterval, newRepetitions };
  }
}
