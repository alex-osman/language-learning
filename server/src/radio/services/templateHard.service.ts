import { Injectable } from '@nestjs/common';
import { HardWordsQueryService } from './hardWordsQuery.service';
import { CharacterService } from '../../services/character.service';

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

  async buildHardSegments(): Promise<AudioSegment[]> {
    const words = await this.hardWordsQueryService.getHardest(); // Will get 1 character by default
    const segments: AudioSegment[] = [];

    words.forEach((w, i) => {
      // Use existing CharacterService methods instead of duplicating logic
      const toneNumber = this.characterService.getToneNumber(w.pinyin);
      const pinyinNoTones = this.characterService.removeToneMarks(w.pinyin);

      // 1. "First character"
      segments.push({
        type: 'text',
        content: `${this.ord[i]} character.`,
        lang: 'en',
      });
      segments.push({ type: 'pause', duration: this.SHORT_PAUSE });

      // 2. Chinese character
      segments.push({ type: 'text', content: w.character, lang: 'zh' });
      segments.push({ type: 'pause', duration: '500ms' });

      // 3. Spell pinyin letters (no SSML, just spell them out)
      const spelledPinyin = pinyinNoTones.split('').join(' '); // "ma" -> "m a"
      segments.push({ type: 'text', content: spelledPinyin, lang: 'en' });
      segments.push({ type: 'pause', duration: '300ms' });

      // 4. Tone number
      segments.push({
        type: 'text',
        content: `tone ${toneNumber}`,
        lang: 'en',
      });
      segments.push({ type: 'pause', duration: '500ms' });

      // 5. Chinese character again
      segments.push({ type: 'text', content: w.character, lang: 'zh' });
      segments.push({ type: 'pause', duration: this.SHORT_PAUSE });

      // 6. English meaning
      segments.push({
        type: 'text',
        content: `Means ${w.definition}`,
        lang: 'en',
      });
      segments.push({ type: 'pause', duration: this.LONG_PAUSE });
    });

    return segments;
  }
}
