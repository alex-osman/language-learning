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
  private readonly SHORT_PAUSE = '700ms';
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
   * @returns A list of audio segments with AI-generated DJ content.
   */
  async buildHardSegments(): Promise<AudioSegment[]> {
    const words = await this.hardWordsQueryService.getHardest(2); // Test with 1 character first
    const segments: AudioSegment[] = [];

    for (let i = 0; i < words.length; i++) {
      const character = words[i];
      const characterNumber = i + 1;

      // Use existing CharacterService methods
      const toneNumber = this.characterService.getToneNumber(character.pinyin);
      const pinyinNoTones = this.characterService.removeToneMarks(
        character.pinyin,
      );
      const spelledPinyin = pinyinNoTones.split('').join('-').toUpperCase(); // "ma" -> "M-A"

      // 1. AI DJ Intro
      const djIntro = await this.djScriptService.generateIntro(
        character,
        characterNumber,
      );
      segments.push({ type: 'text', content: djIntro, lang: 'en' });
      segments.push({ type: 'pause', duration: this.SHORT_PAUSE });

      // 2. AI DJ Spelling intro + spelled pinyin + tone
      const spellingIntro = await this.djScriptService.generateSpellingIntro(
        spelledPinyin,
        toneNumber,
      );
      segments.push({ type: 'text', content: spellingIntro, lang: 'en' });
      segments.push({ type: 'pause', duration: '300ms' });

      // 3. AI DJ Movie Context - connects definition to movie scene
      const movieContext =
        await this.djScriptService.generateMovieContext(character);
      segments.push({ type: 'text', content: movieContext, lang: 'en' });

      // 4. Extra long pause between characters (shorter for last character)
      const pauseDuration =
        i === words.length - 1 ? this.LONG_PAUSE : this.EXTRA_LONG_PAUSE;
      segments.push({ type: 'pause', duration: pauseDuration });
    }

    return segments;
  }
}
