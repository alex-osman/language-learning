import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, MoreThan } from 'typeorm';
import { Character } from '../entities/character.entity';
import { CharacterDTO, PropDTO } from '@shared/interfaces/data.interface';
import { TONE_MAP, TWO_LETTER_INITIALS, VOWEL_MAP } from './pinyin.constants';
import { SetService } from './set.service';
import { ActorService } from './actor.service';
import { RadicalPropService } from './radical-prop.service';
import { SentenceService } from './sentence.service';
import { SentenceDTO } from '@shared/interfaces/sentence.interface';
import { UserCharacterKnowledgeService } from './user-character-knowledge.service';
import { UserCharacterKnowledge } from 'src/entities/user-character-knowledge.entity';

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    private actorService: ActorService,
    private setService: SetService,
    private radicalPropService: RadicalPropService,
    private sentenceService: SentenceService,
    private userCharacterKnowledgeService: UserCharacterKnowledgeService,
  ) {}

  async getAllCharacterDTOs(
    userId: number,
    additionalCount?: number,
  ): Promise<CharacterDTO[]> {
    const charactersWithKnowledge = await this.characterRepository
      .createQueryBuilder('character')
      .leftJoin(
        UserCharacterKnowledge,
        'userCharacterKnowledge',
        'userCharacterKnowledge.characterID = character.id',
      )
      .where('userCharacterKnowledge.userID = :userId', { userId })
      .getMany();

    const latestChar =
      charactersWithKnowledge.sort((a, b) => b.id - a.id)[0] ?? null;

    let additional: Character[] = [];
    if (additionalCount) {
      additional = await this.characterRepository.find({
        where: {
          id: MoreThan(latestChar?.id ?? 0),
        },
        order: {
          id: 'ASC',
        },
        take: additionalCount,
      });
    }
    return Promise.all(
      [...charactersWithKnowledge, ...additional].map(async (item) =>
        this.makeCharacterDTO(item, userId),
      ),
    );
  }

  async findOne(id: number): Promise<Character | null> {
    return this.characterRepository.findOneOrFail({ where: { id } });
  }

  async getOneCharacterDTO(
    id: number,
    userId?: number,
  ): Promise<CharacterDTO | null> {
    const character = await this.findOne(id);
    if (!character) return null;
    return this.makeCharacterDTO(character, userId);
  }

  async makeCharacterDTO(
    character: Character,
    userId?: number,
  ): Promise<CharacterDTO> {
    // Get user-specific data if userId is provided
    let mergedCharacter = character as any;
    let userKnowledge: UserCharacterKnowledge = {
      movie: '',
      imgUrl: '',
      easinessFactor: 2.5,
      repetitions: 0,
      interval: 0,
      characterID: character.id,
      userID: 0,
      id: 0,
    };
    if (userId) {
      const existingUserKnowledge =
        await this.userCharacterKnowledgeService.findByUserAndCharacter(
          userId,
          character.id,
        );
      if (existingUserKnowledge) {
        userKnowledge = existingUserKnowledge;
      }
      if (userKnowledge) {
        // Merge character metadata with user-specific data
        mergedCharacter = {
          ...character,
          movie: userKnowledge.movie || null,
          imgUrl: userKnowledge.imgUrl || null,
          learnedDate: userKnowledge.learnedDate || null,
          easinessFactor: userKnowledge.easinessFactor ?? 2.5,
          repetitions: userKnowledge.repetitions ?? 0,
          interval: userKnowledge.interval ?? 0,
          nextReviewDate: userKnowledge.nextReviewDate || null,
          lastReviewDate: userKnowledge.lastReviewDate || null,
        };
      }
    }

    const { final, initial } = this.parsePinyin(
      this.removeToneMarks(mergedCharacter.pinyin),
    );
    const initialActor = await this.actorService.findByInitial(initial);
    const finalSet = await this.setService.findByFinal(final);
    const radicals = await Promise.all(
      (mergedCharacter.radicals?.split(',') ?? []).map(async (radical) => {
        const radicalProp =
          await this.radicalPropService.findByRadical(radical);
        return radicalProp;
      }),
    );

    // Calculate if the character is due for review
    const now = new Date();
    const dueForReview = mergedCharacter.nextReviewDate
      ? mergedCharacter.nextReviewDate <= now
      : false;

    return {
      id: mergedCharacter.id,
      character: mergedCharacter.character,
      pinyin: mergedCharacter.pinyin,
      definition: mergedCharacter.definition,
      initial,
      final,
      toneNumber: this.getToneNumber(mergedCharacter.pinyin),
      radicals: radicals.filter((radical) => radical !== null) as PropDTO[],
      finalSet: finalSet ?? undefined,
      initialActor: initialActor ?? undefined,
      movie: mergedCharacter.movie,
      imgUrl: mergedCharacter.imgUrl,
      freq: mergedCharacter.freq,
      // Add spaced repetition fields
      easinessFactor: mergedCharacter.easinessFactor,
      repetitions: mergedCharacter.repetitions,
      interval: mergedCharacter.interval,
      nextReviewDate: mergedCharacter.nextReviewDate,
      lastReviewDate: mergedCharacter.lastReviewDate,
      dueForReview,
    };
  }

  async findByCharacter(char: string): Promise<Character | null> {
    return this.characterRepository.findOne({ where: { character: char } });
  }

  async create(character: Partial<Character>): Promise<Character> {
    const newCharacter = this.characterRepository.create(character);
    return this.characterRepository.save(newCharacter);
  }

  async update(
    id: number,
    character: Partial<Character>,
  ): Promise<Character | null> {
    await this.characterRepository.update(id, character);
    return this.characterRepository.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.characterRepository.delete(id);
  }

  async getNextCharacterWithoutMovie(
    userId: number,
  ): Promise<CharacterDTO | null> {
    const character =
      await this.userCharacterKnowledgeService.getNextCharacterWithoutMovie(
        userId,
      );
    if (!character) return null;

    return this.makeCharacterDTO(character, userId);
  }

  removeToneMarks(pinyin: string): string {
    if (!pinyin) {
      return '';
    }
    return pinyin
      .toLowerCase()
      .split('')
      .map((char) => VOWEL_MAP[char] || char)
      .join('');
  }

  parsePinyin(pinyinNoTones: string): { initial: string; final: string } {
    if (!pinyinNoTones) return { initial: '', final: '' };
    if (pinyinNoTones === 'er') return { initial: 'ø', final: 'er' };

    let initial = '';
    let final = '';

    // Handle three-letter initials first
    if (pinyinNoTones.startsWith('zhu')) {
      initial = 'zhu';
      final = pinyinNoTones.substring(3);
    } else if (pinyinNoTones.startsWith('shu')) {
      initial = 'shu';
      final = pinyinNoTones.substring(3);
    }
    // Handle two-letter initials with 'u'
    else if (pinyinNoTones.length >= 2 && pinyinNoTones[1] === 'u') {
      initial = pinyinNoTones.substring(0, 2);
      final = pinyinNoTones.substring(2);
    }
    // Handle initials ending in 'i' that combine with following vowels
    else if (pinyinNoTones.startsWith('bi') && pinyinNoTones.length > 2) {
      initial = 'bi';
      final = pinyinNoTones.substring(2);
    } else if (pinyinNoTones.startsWith('mi') && pinyinNoTones.length > 2) {
      initial = 'mi';
      final = pinyinNoTones.substring(2);
    } else if (pinyinNoTones.startsWith('di') && pinyinNoTones.length > 2) {
      initial = 'di';
      final = pinyinNoTones.substring(2);
    } else if (pinyinNoTones.startsWith('ji') && pinyinNoTones.length > 2) {
      initial = 'ji';
      final = pinyinNoTones.substring(2);
    } else if (pinyinNoTones.startsWith('xi') && pinyinNoTones.length > 2) {
      initial = 'xi';
      final = pinyinNoTones.substring(2);
    }
    // Handle two-letter cases that are complete initials
    else if (pinyinNoTones.length === 2 && pinyinNoTones[1] === 'i') {
      const firstChar = pinyinNoTones[0];
      if (['x', 'j'].includes(firstChar)) {
        // For 'x' and 'j', use the full two letters as initial
        initial = pinyinNoTones;
        final = '';
      } else if (['z', 's', 'r'].includes(firstChar)) {
        // For 'z', 's', 'r', use just the consonant as initial
        initial = firstChar;
        final = '';
      } else if (firstChar === 'l') {
        // Special case: 'li' is a complete initial
        initial = pinyinNoTones;
        final = '';
      } else {
        // For other consonants, split into consonant + 'i' final
        initial = firstChar;
        final = 'i';
      }
    }
    // Handle other common initials
    else if (
      ['bu', 'ju', 'fu', 'cu'].some((prefix) =>
        pinyinNoTones.startsWith(prefix),
      )
    ) {
      const prefix = ['bu', 'ju', 'fu', 'cu'].find((p) =>
        pinyinNoTones.startsWith(p),
      )!;
      initial = prefix;
      final = pinyinNoTones.substring(prefix.length);
    }
    // Handle consonant clusters
    else if (
      ['shi', 'chi', 'zhi', 'yi'].some((cluster) =>
        pinyinNoTones.startsWith(cluster),
      )
    ) {
      const cluster = ['shi', 'chi', 'zhi', 'yi'].find((c) =>
        pinyinNoTones.startsWith(c),
      )!;
      initial = cluster.substring(0, 2);
      final = pinyinNoTones.substring(cluster.length);
    }
    // Handle two-letter initials from constants
    else if (TWO_LETTER_INITIALS.some((i) => pinyinNoTones.startsWith(i))) {
      const matchedInitial = TWO_LETTER_INITIALS.find((i) =>
        pinyinNoTones.startsWith(i),
      )!;
      initial = matchedInitial;
      final = pinyinNoTones.substring(matchedInitial.length);
    }
    // Default single-consonant initial
    else {
      const firstChar = pinyinNoTones[0];
      if (firstChar === 'w') {
        initial = firstChar;
        final = '';
      } else {
        initial = firstChar;
        final = pinyinNoTones.substring(1);
      }
    }

    return { initial, final };
  }

  getInitial(pinyin: string): string {
    const pinyinNoTones = this.removeToneMarks(pinyin);

    return pinyinNoTones.split(' ')[0];
  }

  getFinal(pinyin: string): string {
    return pinyin.split(' ')[1];
  }

  getToneNumber(pinyin: string): number {
    if (!pinyin) return 5;
    for (const char of pinyin) {
      const tone = TONE_MAP[char];
      if (tone) return tone;
    }
    return 5;
  }
}
