import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThanOrEqual, Not } from 'typeorm';
import { CharacterService } from '../../services/character.service';
import { Character } from '../../entities/character.entity';

@Injectable()
export class NextCharacterQueryService {
  constructor(
    private characterService: CharacterService,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
  ) {}

  async getNextCharacterForPreview(): Promise<Character | null> {
    // Reuse existing logic to get next character without movie
    const characterDTO =
      await this.characterService.getNextCharacterWithoutMovie();

    if (!characterDTO) {
      return null;
    }

    // Convert DTO back to entity for our radio services
    // We need the raw entity for our radio generation
    return this.convertToEntity(characterDTO);
  }

  async getNextCharactersForPreview(count: number = 5): Promise<Character[]> {
    // Get the first character without movie as starting point
    const firstCharacterDTO =
      await this.characterService.getNextCharacterWithoutMovie();

    if (!firstCharacterDTO) {
      return [];
    }

    // Get up to 'count' characters starting from the first one without movie
    const characterDTOs = await this.characterRepository.find({
      where: {
        movie: IsNull(),
        id: MoreThanOrEqual(firstCharacterDTO.id),
      },
      order: { id: 'ASC' },
      take: count,
    });

    return characterDTOs.map((char) => this.convertToEntity(char));
  }

  async getCharactersForPreview(
    count: number = 5,
    mode: 'next' | 'random' = 'next',
  ): Promise<Character[]> {
    if (mode === 'random') {
      return this.getRandomCharactersForPreview(count);
    } else {
      return this.getNextCharactersForPreview(count);
    }
  }

  async getRandomCharactersForPreview(count: number = 5): Promise<Character[]> {
    // Get all characters without movies that have definitions
    const characterDTOs = await this.characterRepository.find({
      where: {
        movie: IsNull(),
        definition: Not(IsNull()),
      },
    });

    if (characterDTOs.length === 0) {
      return [];
    }

    // Shuffle and take the requested count
    const shuffled = characterDTOs.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map((char) => this.convertToEntity(char));
  }

  private convertToEntity(characterDTO: any): Character {
    return {
      id: characterDTO.id,
      character: characterDTO.character,
      pinyin: characterDTO.pinyin,
      definition: characterDTO.definition,
      radicals: characterDTO.radicals?.map((r) => r.radical).join(',') || '',
      movie: undefined, // Character without movie
      imgUrl: characterDTO.imgUrl || undefined,
      easinessFactor: characterDTO.easinessFactor || 2.5,
      repetitions: characterDTO.repetitions || 0,
      interval: characterDTO.interval || 0,
      nextReviewDate: characterDTO.nextReviewDate || undefined,
      lastReviewDate: characterDTO.lastReviewDate || undefined,
    } as unknown as Character;
  }
}
