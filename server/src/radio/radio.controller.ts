import { Controller, Post, StreamableFile, Header } from '@nestjs/common';
import { TemplateHardService } from './services/templateHard.service';
import { RadioTtsService } from './services/tts.service';
import * as fs from 'fs';

@Controller('api/radio')
export class RadioController {
  constructor(
    private readonly templateService: TemplateHardService,
    private readonly ttsService: RadioTtsService,
  ) {}

  @Post('hard-segment')
  @Header('Content-Type', 'audio/mpeg')
  async generateHardSegment(): Promise<StreamableFile> {
    const segs = await this.templateService.buildHardSegments();
    const mp3File = await this.ttsService.ssmlToMp3(segs);
    const buffer = fs.readFileSync(mp3File);
    return new StreamableFile(buffer);
  }
}
