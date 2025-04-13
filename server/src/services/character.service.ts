import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
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
    });
    return Promise.all(
      all.map(async (character) => this.makeCharacterDTO(character)),
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

    // Handle special cases first
    if (pinyinNoTones.length >= 2 && pinyinNoTones[1] === 'u') {
      initial = pinyinNoTones.substring(0, 2);
      final = pinyinNoTones.substring(2);
    } else if (pinyinNoTones.length === 2 && pinyinNoTones[1] === 'i') {
      initial = pinyinNoTones[0] === 'x' ? pinyinNoTones : pinyinNoTones[0];
      final = '';
    } else if (pinyinNoTones.startsWith('bu')) {
      initial = 'bu';
      final = pinyinNoTones.substring(2);
    } else if (pinyinNoTones.startsWith('ju')) {
      initial = 'ju';
      final = pinyinNoTones.substring(2);
    } else if (pinyinNoTones.startsWith('fu')) {
      initial = 'fu';
      final = pinyinNoTones.substring(2);
    } else if (pinyinNoTones.startsWith('cu')) {
      initial = 'cu';
      final = pinyinNoTones.substring(2);
    } else if (pinyinNoTones.startsWith('mi')) {
      initial = 'mi';
      final = `${pinyinNoTones.substring(2)}`;
    } else if (pinyinNoTones.startsWith('shu')) {
      initial = 'shu';
      final = pinyinNoTones.substring(3);
    } else if (pinyinNoTones.startsWith('di')) {
      initial = 'di';
      final = pinyinNoTones.substring(2);
    } else if (
      ['shi', 'chi', 'zhi', 'yi', 'si'].some((i) => pinyinNoTones.startsWith(i))
    ) {
      if (pinyinNoTones === 'si') {
        initial = 's';
      } else {
        initial = pinyinNoTones.substring(0, 2);
      }
      final = '';
    } else if (
      pinyinNoTones.startsWith('ku') ||
      pinyinNoTones.startsWith('hu')
    ) {
      initial = pinyinNoTones.substring(0, 2);
      final = pinyinNoTones.substring(2);
    } else if (TWO_LETTER_INITIALS.some((i) => pinyinNoTones.startsWith(i))) {
      initial = pinyinNoTones.substring(0, 2);
      final = pinyinNoTones.substring(2);
    } else {
      const firstChar = pinyinNoTones[0];
      if (firstChar === 'w') {
        initial = firstChar;
        final = '';
      } else if (
        (firstChar === 'd' || firstChar === 'r' || firstChar === 'y') &&
        pinyinNoTones[1] === 'u'
      ) {
        initial = pinyinNoTones.substring(0, 2);
        final = pinyinNoTones.substring(2);
      } else if (firstChar === 'r' && pinyinNoTones === 'ri') {
        initial = 'r';
        final = '';
      } else {
        // For non-standard inputs, don't apply INITIAL_MAPPINGS
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
