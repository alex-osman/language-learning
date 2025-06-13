import { Controller, Post, StreamableFile, Header } from '@nestjs/common';
import { TemplateHardService } from './services/templateHard.service';
import { RadioTtsService } from './services/tts.service';
import { SilenceService } from './services/silence.service';
import { ConcatService } from './services/concat.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/radio')
export class RadioController {
  constructor(
    private readonly templateService: TemplateHardService,
    private readonly ttsService: RadioTtsService,
    private readonly silenceService: SilenceService,
    private readonly concatService: ConcatService,
  ) {}

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
