import { Injectable } from '@nestjs/common';
import { NextCharacterQueryService } from './nextCharacterQuery.service';
import { DjScriptService } from './djScript.service';
import { AudioSegment } from './templateHard.service';

@Injectable()
export class TemplatePreviewService {
  constructor(
    private nextCharacterQueryService: NextCharacterQueryService,
    private djScriptService: DjScriptService,
  ) {}

  // Hardcoded config values
  private readonly SHORT_PAUSE = '500ms';
  private readonly FINAL_PAUSE = '1s';

  /**
   * Builds preview segments for the next character to learn.
   *
   * Simplified segment structure:
   * 1. Complete AI DJ Script (English) - 25-35 seconds
   * 2. Pause - 500ms
   * 3. Chinese Character Pronunciation - 2-3 seconds
   * 4. Final Pause - 1s
   *
   * Total: ~30-40 seconds with only 4 segments
   *
   * @returns A list of audio segments for the preview, or empty array if no character available
   */
  async buildPreviewSegments(): Promise<AudioSegment[]> {
    const character =
      await this.nextCharacterQueryService.getNextCharacterForPreview();

    if (!character) {
      console.log(
        'No character available for preview - all characters have movies',
      );
      return [];
    }

    const segments: AudioSegment[] = [];

    // 1. Complete AI DJ Script (English)
    const completeScript =
      await this.djScriptService.generateCompletePreviewScript(character);
    segments.push({ type: 'text', content: completeScript, lang: 'en' });
    segments.push({ type: 'pause', duration: this.SHORT_PAUSE });

    // 2. Chinese Character Pronunciation
    segments.push({ type: 'text', content: character.character, lang: 'zh' });
    segments.push({ type: 'pause', duration: this.FINAL_PAUSE });

    console.log(
      `Preview segments built for character: ${character.character} (${character.definition})`,
    );
    return segments;
  }
}
