import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, MoreThan } from 'typeorm';
import { Character } from '../entities/character.entity';
import { CharacterDTO, PropDTO } from '@shared/interfaces/data.interface';
import { TONE_MAP, TWO_LETTER_INITIALS, VOWEL_MAP } from './pinyin.constants';
import { SetService } from './set.service';
import { ActorService } from './actor.service';
import { RadicalPropService } from './radical-prop.service';
@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    private actorService: ActorService,
    private setService: SetService,
    private radicalPropService: RadicalPropService,
  ) {}

  async getAllCharacterDTOs(): Promise<CharacterDTO[]> {
    const all = await this.characterRepository.find({
      where: {
        movie: Not(IsNull()),
      },
      order: {
        id: 'DESC',
      },
    });
    const latestChar = all[0];
    const plusFive = await this.characterRepository.find({
      where: {
        id: MoreThan(latestChar.id),
      },
      order: {
        id: 'ASC',
      },
      take: 5,
    });
    return Promise.all(
      [...all, ...plusFive].map(async (character) =>
        this.makeCharacterDTO(character),
      ),
    );
  }

  async findOne(id: number): Promise<Character | null> {
    return this.characterRepository.findOneOrFail({ where: { id } });
  }

  async getOneCharacterDTO(id: number): Promise<CharacterDTO | null> {
    const character = await this.findOne(id);
    if (!character) return null;
    return this.makeCharacterDTO(character);
  }

  async makeCharacterDTO(character: Character): Promise<CharacterDTO> {
    const { final, initial } = this.parsePinyin(
      this.removeToneMarks(character.pinyin),
    );
    const initialActor = await this.actorService.findByInitial(initial);
    const finalSet = await this.setService.findByFinal(final);
    const radicals = await Promise.all(
      (character.radicals?.split(',') ?? []).map(async (radical) => {
        const radicalProp =
          await this.radicalPropService.findByRadical(radical);
        return radicalProp;
      }),
    );

    // Calculate if the character is due for review
    const now = new Date();
    const dueForReview = character.nextReviewDate
      ? character.nextReviewDate <= now
      : false;

    return {
      id: character.id,
      character: character.character,
      pinyin: character.pinyin,
      definition: character.definition,
      initial,
      final,
      toneNumber: this.getToneNumber(character.pinyin),
      radicals: radicals.filter((radical) => radical !== null) as PropDTO[],
      finalSet: finalSet ?? undefined,
      initialActor: initialActor ?? undefined,
      movie: character.movie,
      imgUrl: character.imgUrl,
      // Add spaced repetition fields
      easinessFactor: character.easinessFactor,
      repetitions: character.repetitions,
      interval: character.interval,
      nextReviewDate: character.nextReviewDate,
      lastReviewDate: character.lastReviewDate,
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

  async getNextCharacterWithoutMovie(): Promise<CharacterDTO | null> {
    const character = await this.characterRepository.findOne({
      where: { movie: IsNull() },
      order: { id: 'ASC' },
    });

    if (!character) return null;

    return this.makeCharacterDTO(character);
  }

  removeToneMarks(pinyin: string): string {
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
    for (const char of pinyin) {
      const tone = TONE_MAP[char];
      if (tone) return tone;
    }
    return 5;
  }
}
