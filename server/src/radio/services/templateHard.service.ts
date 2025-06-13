import { Injectable } from '@nestjs/common';
import { HardWordsQueryService } from './hardWordsQuery.service';
import { CharacterService } from '../../services/character.service';

interface Segment {
  lang?: string;
  text?: string;
  pause?: string;
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

  async buildHardSegments(): Promise<Segment[]> {
    const words = await this.hardWordsQueryService.getHardest(); // Will get 1 character by default
    const segs: Segment[] = [];

    words.forEach((w, i) => {
      // Use existing CharacterService methods instead of duplicating logic
      const toneNumber = this.characterService.getToneNumber(w.pinyin);
      const pinyinNoTones = this.characterService.removeToneMarks(w.pinyin);

      segs.push({ lang: 'en', text: `${this.ord[i]} character.` });
      segs.push({ pause: this.SHORT_PAUSE });

      // word once (Mandarin)
      segs.push({ lang: 'zh', text: w.character });
      segs.push({ pause: '500ms' });

      // spell pinyin letters via SSML <say-as interpret-as="characters">
      const spelled = `<say-as interpret-as="characters">${pinyinNoTones}</say-as>`;
      segs.push({ lang: 'en', text: spelled });
      segs.push({ pause: '300ms' });
      segs.push({ lang: 'en', text: `tone ${toneNumber}.` });
      segs.push({ pause: '500ms' });

      // word again
      segs.push({ lang: 'zh', text: w.character });
      segs.push({ pause: this.SHORT_PAUSE });

      // English meaning
      segs.push({ lang: 'en', text: `Means ${w.definition}.` });
      segs.push({ pause: this.LONG_PAUSE });
    });

    return segs;
  }
}
