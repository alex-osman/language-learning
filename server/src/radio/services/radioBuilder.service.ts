import { Injectable } from '@nestjs/common';
import { TemplateHardService, AudioSegment } from './templateHard.service';
import { TemplatePreviewService } from './templatePreview.service';

@Injectable()
export class RadioBuilderService {
  constructor(
    private templateHardService: TemplateHardService,
    private templatePreviewService: TemplatePreviewService,
  ) {}

  // Transition pause between segments
  private readonly TRANSITION_PAUSE = '2s';

  /**
   * Builds a complete radio show combining hard words review and next character preview.
   *
   * Structure:
   * 1. Hard Words Segment - Review characters with movies
   * 2. Transition Pause - 2 seconds
   * 3. Preview Segment - Next character to learn (if available)
   *
   * @param latestCharacterId The ID of the most recently learned character (for weighted random selection)
   * @returns Combined audio segments for complete radio show
   */
  async buildCompleteRadioShow(
    latestCharacterId?: number,
  ): Promise<AudioSegment[]> {
    const segments: AudioSegment[] = [];

    console.log('🎙️ Building complete radio show...');

    // 1. Hard Words Segment
    console.log('📚 Adding hard words segment...');
    const hardSegments = await this.templateHardService.buildHardSegments();
    segments.push(...hardSegments);

    // 2. Preview Segment (if available)
    console.log('🔮 Adding preview segment...');
    const previewSegments =
      await this.templatePreviewService.buildMultiCharacterPreviewSegments(
        3,
        'weighted',
        latestCharacterId,
      );

    if (previewSegments.length > 0) {
      // Add transition pause between segments
      segments.push({ type: 'pause', duration: this.TRANSITION_PAUSE });
      segments.push(...previewSegments);
      console.log('✅ Complete radio show built with preview segment');
    } else {
      console.log('ℹ️ No preview segment available - using hard words only');
    }

    console.log(`🎵 Total segments: ${segments.length}`);
    return segments;
  }

  /**
   * Builds only the hard words segment.
   *
   * @returns Hard words audio segments
   */
  async buildHardWordsOnly(): Promise<AudioSegment[]> {
    console.log('📚 Building hard words segment only...');
    return await this.templateHardService.buildHardSegments();
  }

  /**
   * Builds only the preview segment.
   *
   * @returns Preview audio segments, or empty array if no character available
   */
  async buildPreviewOnly(): Promise<AudioSegment[]> {
    console.log('🔮 Building preview segment only...');
    return await this.templatePreviewService.buildPreviewSegments();
  }
}
