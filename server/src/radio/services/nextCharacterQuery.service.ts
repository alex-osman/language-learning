import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThanOrEqual, Not, In } from 'typeorm';
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
    try {
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

      console.log(`🔍 Found ${characterDTOs.length} characters for preview`);
      return characterDTOs.map((char) => this.convertToEntity(char));
    } catch (error) {
      console.error('❌ Error in getNextCharactersForPreview:', error);
      throw error;
    }
  }

  async getCharactersForPreview(
    count: number = 5,
    mode: 'next' | 'random' | 'weighted' = 'next',
    latestCharacterId?: number,
  ): Promise<Character[]> {
    if (mode === 'random') {
      return this.getRandomCharactersForPreview(count);
    } else if (mode === 'weighted') {
      if (!latestCharacterId) {
        console.warn(
          '⚠️ Weighted mode requires latestCharacterId, falling back to random',
        );
        return this.getRandomCharactersForPreview(count);
      }
      return this.getWeightedRandomCharactersForPreview(
        count,
        latestCharacterId,
      );
    } else {
      return this.getNextCharactersForPreview(count);
    }
  }

  async getRandomCharactersForPreview(count: number = 5): Promise<Character[]> {
    try {
      // Get all characters without movies that have definitions
      const characterDTOs = await this.characterRepository.find({
        where: {
          movie: IsNull(),
          definition: Not(IsNull()),
          pinyin: Not(IsNull()),
        },
      });

      if (characterDTOs.length === 0) {
        return [];
      }

      // Shuffle and take the requested count
      const shuffled = characterDTOs.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));

      console.log(`🔍 Found ${selected.length} random characters for preview`);
      return selected.map((char) => this.convertToEntity(char));
    } catch (error) {
      console.error('❌ Error in getRandomCharactersForPreview:', error);
      throw error;
    }
  }

  /**
   * Gets characters for preview using a normal distribution around the latest character.
   * Characters closer to the latest learned character have higher probability.
   *
   * @param count Number of characters to preview
   * @param latestCharacterId The ID of the most recently learned character
   * @param options Configuration options for the distribution
   * @returns Array of characters for preview
   */
  async getWeightedRandomCharactersForPreview(
    count: number = 5,
    latestCharacterId: number,
    options: {
      stdDev?: number; // Controls spread of distribution (default: 10)
      minDistance?: number; // Minimum distance from latest character (default: 1)
      maxDistance?: number; // Maximum distance from latest character (default: 30)
    } = {},
  ): Promise<Character[]> {
    try {
      console.log(
        `🔮 Getting normally distributed characters from latest ID: ${latestCharacterId}`,
      );

      // First, get the latest character to use as reference point
      const latestCharacter = await this.characterRepository.findOne({
        where: { id: latestCharacterId },
      });

      if (!latestCharacter) {
        console.warn(
          `⚠️ Latest character with ID ${latestCharacterId} not found`,
        );
        return this.getRandomCharactersForPreview(count);
      }

      // Configuration with defaults
      const config = {
        stdDev: options.stdDev ?? 20, // Default spread
        minDistance: options.minDistance ?? 2,
        maxDistance: options.maxDistance ?? 400,
      };

      console.log(`📊 Distribution config:`, config);

      // Generate random numbers from a normal distribution
      const targetIds: number[] = [];

      // Generate the target IDs
      for (let i = 0; i < count * 1.2; i++) {
        // Generate extra to account for potential duplicates
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 =
          Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        // Scale to our desired range and add to the latest character ID
        // We use abs() to ensure we only get positive distances
        const distance = Math.floor(Math.abs(z0 * config.stdDev));

        // Clamp the distance to our min/max range
        const clampedDistance = Math.max(
          config.minDistance,
          Math.min(config.maxDistance, distance),
        );

        const targetId = latestCharacterId + clampedDistance;

        // Only add if it's greater than the latest character ID
        if (targetId > latestCharacterId) {
          targetIds.push(targetId);
        }
      }

      // Remove duplicates and sort
      const uniqueTargetIds = [...new Set(targetIds)].sort((a, b) => a - b);
      console.log(`🔢 Generated target IDs: ${uniqueTargetIds.join(', ')}`);

      // Fetch only the characters we need
      const characters = await this.characterRepository.find({
        where: {
          id: In(uniqueTargetIds.slice(0, count)),
          movie: IsNull(),
          definition: Not(IsNull()),
          pinyin: Not(IsNull()),
        },
      });

      console.log(
        `✅ Found ${characters.length} characters for the generated IDs`,
      );

      // Convert to entities
      return characters.map((char) => this.convertToEntity(char));
    } catch (error) {
      console.error(
        '❌ Error in getWeightedRandomCharactersForPreview:',
        error,
      );
      throw error;
    }
  }

  private convertToEntity(characterDTO: any): Character {
    // Debug logging to understand the structure
    console.log('🔍 Converting character:', {
      id: characterDTO.id,
      character: characterDTO.character,
      radicalsType: typeof characterDTO.radicals,
      radicalsValue: characterDTO.radicals,
    });

    // Handle both string and array formats for radicals
    let radicals = '';
    if (characterDTO.radicals) {
      if (typeof characterDTO.radicals === 'string') {
        // Already a string, use as-is
        radicals = characterDTO.radicals;
      } else if (Array.isArray(characterDTO.radicals)) {
        // Array of radical objects, extract and join
        radicals = characterDTO.radicals.map((r) => r.radical || r).join(',');
      } else {
        console.warn('⚠️ Unexpected radicals format:', characterDTO.radicals);
        radicals = '';
      }
    }

    return {
      id: characterDTO.id,
      character: characterDTO.character,
      pinyin: characterDTO.pinyin,
      definition: characterDTO.definition,
      radicals: radicals,
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
