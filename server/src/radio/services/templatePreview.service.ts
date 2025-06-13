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
   * (Backward compatibility - single character preview)
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
    console.log(
      `🔮 Building preview segment for character: ${character.character}`,
    );

    const segments: AudioSegment[] = [];

    // 1. Complete AI DJ Script (English)
    const completeScript =
      await this.djScriptService.generateCompletePreviewScript(character);
    segments.push({ type: 'text', content: completeScript, lang: 'en' });
    segments.push({ type: 'pause', duration: this.SHORT_PAUSE });

    console.log(
      `Preview segments built for character: ${character.character} (${character.definition})`,
    );
    return segments;
  }

  /**
   * Builds modular preview segments for multiple characters.
   * Each character gets a context-aware script based on its position.
   *
   * @param count Number of characters to preview (default: 5)
   * @returns A list of audio segments for the multi-character preview
   */
  async buildMultiCharacterPreviewSegments(
    count: number = 5,
  ): Promise<AudioSegment[]> {
    const characters =
      await this.nextCharacterQueryService.getNextCharactersForPreview(count);

    if (characters.length === 0) {
      console.log('No characters available for preview');
      return [];
    }

    console.log(`🔮 Building preview for ${characters.length} characters`);
    const segments: AudioSegment[] = [];

    for (let i = 0; i < characters.length; i++) {
      const current = characters[i];
      const previous = i > 0 ? characters[i - 1] : undefined;
      const next = i < characters.length - 1 ? characters[i + 1] : undefined;

      // Generate context-aware script for this character
      const script = await this.djScriptService.generateCharacterPreviewScript(
        current,
        previous,
        next,
      );

      // Add script and pronunciation
      segments.push({ type: 'text', content: script, lang: 'en' });
      segments.push({ type: 'pause', duration: this.SHORT_PAUSE });
    }

    // Final pause
    segments.push({ type: 'pause', duration: this.FINAL_PAUSE });

    console.log(`Preview segments built for ${characters.length} characters`);
    return segments;
  }
}
