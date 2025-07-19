import { Injectable } from '@nestjs/common';
import { NextCharacterQueryService } from './nextCharacterQuery.service';
import { DjScriptService } from './djScript.service';
import { AudioSegment } from './templateHard.service';
import { assert } from 'console';

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
  async buildPreviewSegments(
    mode: 'next' | 'random' = 'next',
    userId?: number,
  ): Promise<AudioSegment[]> {
    const character =
      mode === 'random'
        ? (
            await this.nextCharacterQueryService.getRandomCharactersForPreview(
              1,
              userId,
            )
          )[0]
        : await this.nextCharacterQueryService.getNextCharacterForPreview(
            userId!,
          );

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
   * Uses a single LLM request to generate the complete preview script.
   *
   * @param count Number of characters to preview (default: 5)
   * @param mode Selection mode: 'next' for ordered sequence, 'random' for random selection, or 'weighted' for weighted random (default: 'next')
   * @param latestCharacterId The ID of the most recently learned character (required for 'weighted' mode)
   * @returns A list of audio segments for the multi-character preview
   */
  async buildMultiCharacterPreviewSegments(
    count: number = 5,
    mode: 'next' | 'random' | 'weighted' = 'next',
    latestCharacterId?: number,
    userId?: number,
  ): Promise<AudioSegment[]> {
    if (!latestCharacterId && mode === 'weighted') {
      const lastCharacter =
        await this.nextCharacterQueryService.getNextCharacterForPreview(
          userId!,
        );
      latestCharacterId = lastCharacter?.id;
    }

    const characters =
      await this.nextCharacterQueryService.getCharactersForPreview(
        count,
        mode,
        latestCharacterId,
      );

    console.log('🔮 Characters:', characters);
    if (characters.length === 0) {
      console.log('No characters available for preview');
      return [];
    }

    const modeText =
      mode === 'random'
        ? 'random'
        : mode === 'weighted'
          ? 'weighted random'
          : 'next';
    console.log(
      `🔮 Building ${modeText} preview for ${characters.length} characters`,
    );
    const segments: AudioSegment[] = [];

    // Generate complete preview script in a single LLM request
    const completeScript =
      await this.djScriptService.generateMultiCharacterPreviewScript(
        characters,
      );

    // Add the complete script as a single segment
    segments.push({ type: 'text', content: completeScript, lang: 'en' });
    segments.push({ type: 'pause', duration: this.FINAL_PAUSE });

    console.log(
      `Preview segments built for ${characters.length} characters (${modeText} mode)`,
    );
    return segments;
  }
}
