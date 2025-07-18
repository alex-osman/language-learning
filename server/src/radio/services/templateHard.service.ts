import { Injectable } from '@nestjs/common';
import { HardWordsQueryService } from './hardWordsQuery.service';
import { CharacterService } from '../../services/character.service';
import { DjScriptService } from './djScript.service';

export interface AudioSegment {
  type: 'text' | 'pause';
  content?: string;
  lang?: 'en' | 'zh';
  duration?: string; // for pauses: "700ms", "1s"
}

const INTRO_TEXT = `Welcome to the Hard Words Review.  Lets begin.`;
@Injectable()
export class TemplateHardService {
  constructor(
    private hardWordsQueryService: HardWordsQueryService,
    private characterService: CharacterService, // Reuse existing service
    private djScriptService: DjScriptService, // NEW: AI DJ script generation
  ) {}

  private readonly ord = [
    'First',
    'Second',
    'Third',
    'Fourth',
    'Fifth',
    'Sixth',
    'Seventh',
    'Eighth',
    'Ninth',
    'Tenth',
  ];

  // Hardcoded config values
  private readonly LONG_PAUSE = '1s';
  private readonly EXTRA_LONG_PAUSE = '2s'; // For between characters

  /**
   * Builds a list of audio segments with AI DJ host commentary.
   *
   * Enhanced segment structure per character:
   * 1. AI DJ Intro - "Hey language learners! Let's dive into our [ordinal] character..."
   * 2. Chinese character pronunciation
   * 3. AI DJ Spelling intro + spelled pinyin + tone
   * 4. Chinese character pronunciation again
   * 5. AI DJ Movie Context - Connects definition to movie scene
   * 6. Extra long pause between characters
   *
   * @param userId The user ID for getting user-specific data
   * @returns A list of audio segments with AI-generated DJ content.
   */
  async buildHardSegments(userId: number): Promise<AudioSegment[]> {
    const words = await this.hardWordsQueryService.getHardest(3, userId); // Test with 1 character first
    const segments: AudioSegment[] = [];

    for (let i = 0; i < words.length; i++) {
      const character = words[i];
      segments.push({
        type: 'text',
        content: i
          ? `The next character is ${character.pinyin}.`
          : `${INTRO_TEXT}  The first character is ${character.pinyin}.`,
      });

      // Use existing CharacterService methods
      const toneNumber = this.characterService.getToneNumber(character.pinyin);
      const pinyinNoTones = this.characterService.removeToneMarks(
        character.pinyin,
      );
      const spelledPinyin = pinyinNoTones.split('').join('-').toUpperCase(); // "ma" -> "M-A"

      // 1. AI DJ Spelling intro + spelled pinyin + tone
      const spellingIntro = await this.djScriptService.generateSpellingIntro(
        spelledPinyin,
        toneNumber,
      );
      segments.push({ type: 'text', content: spellingIntro, lang: 'en' });
      segments.push({ type: 'pause', duration: '300ms' });

      // 2. AI DJ Movie Context - connects definition to movie scene
      const movieContext = await this.djScriptService.generateMovieContext(
        character,
        userId,
      );
      segments.push({ type: 'text', content: movieContext, lang: 'en' });

      // 3. Extra long pause between characters (shorter for last character)
      const pauseDuration =
        i === words.length - 1 ? this.LONG_PAUSE : this.EXTRA_LONG_PAUSE;
      segments.push({ type: 'pause', duration: pauseDuration });
    }

    return segments;
  }
}
