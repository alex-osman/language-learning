import { Controller, Post, Get, StreamableFile, Header } from '@nestjs/common';
import { TemplateHardService } from './services/templateHard.service';
import { RadioTtsService } from './services/tts.service';
import { SilenceService } from './services/silence.service';
import { ConcatService } from './services/concat.service';
import { RadioBuilderService } from './services/radioBuilder.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/radio')
export class RadioController {
  constructor(
    private readonly templateService: TemplateHardService,
    private readonly ttsService: RadioTtsService,
    private readonly silenceService: SilenceService,
    private readonly concatService: ConcatService,
    private readonly radioBuilderService: RadioBuilderService,
  ) {}

  @Get('latest-podcast')
  @Header('Content-Type', 'audio/mpeg')
  @Header(
    'Content-Disposition',
    'attachment; filename="chinese-learning-podcast.mp3"',
  )
  async getLatestPodcast(): Promise<StreamableFile> {
    console.log('🎙️ Generating latest podcast...');

    // Build complete radio show
    const segments = await this.radioBuilderService.buildCompleteRadioShow();
    const audioFiles: string[] = [];

    // Process each segment individually
    for (const segment of segments) {
      console.log('🎙️ Processing segment:', segment);
      if (segment.type === 'text') {
        const mp3File = await this.ttsService.textToMp3(
          segment.content!,
          segment.lang!,
        );
        audioFiles.push(mp3File);
      } else if (segment.type === 'pause') {
        const silenceFile = this.silenceService.createSilence(
          segment.duration!,
        );
        audioFiles.push(silenceFile);
      }
    }

    // Create temporary output file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempFile = path.join(
      process.cwd(),
      'radio-cache',
      `podcast_${timestamp}.mp3`,
    );

    console.log('🎙️ Concatenating audio files...');
    this.concatService.concat(audioFiles, tempFile);

    console.log('🎙️ Reading buffer...');
    const buffer = fs.readFileSync(tempFile);

    // Clean up temp file
    fs.unlinkSync(tempFile);

    // Clean up individual segment files
    audioFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    console.log('✅ Podcast generated successfully');
    return new StreamableFile(buffer);
  }

  @Post('hard-segment')
  @Header('Content-Type', 'audio/mpeg')
  async generateHardSegment(): Promise<StreamableFile> {
    const segments = await this.templateService.buildHardSegments();
    const audioFiles: string[] = [];

    // Process each segment individually
    for (const segment of segments) {
      if (segment.type === 'text') {
        const mp3File = await this.ttsService.textToMp3(
          segment.content!,
          segment.lang!,
        );
        audioFiles.push(mp3File);
      } else if (segment.type === 'pause') {
        const silenceFile = this.silenceService.createSilence(
          segment.duration!,
        );
        audioFiles.push(silenceFile);
      }
    }

    // Create temporary output file
    const tempFile = path.join(
      process.cwd(),
      'radio-cache',
      `temp_${Date.now()}.mp3`,
    );
    this.concatService.concat(audioFiles, tempFile);

    const buffer = fs.readFileSync(tempFile);

    // Clean up temp file
    fs.unlinkSync(tempFile);

    return new StreamableFile(buffer);
  }
}
