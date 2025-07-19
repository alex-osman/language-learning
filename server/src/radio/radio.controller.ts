import { Controller, Post, Get, StreamableFile, Header } from '@nestjs/common';
import { TemplateHardService } from './services/templateHard.service';
import { RadioTtsService } from './services/tts.service';
import { SilenceService } from './services/silence.service';
import { ConcatService } from './services/concat.service';
import { RadioBuilderService } from './services/radioBuilder.service';
import { UserID } from 'src/decorators/user.decorator';
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

  /**
   * Get today's date in DD-MM-YYYY format
   */
  private getTodayDateString(): string {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Get the path for today's podcast file
   */
  private getTodayPodcastPath(): string {
    const dateString = this.getTodayDateString();
    return path.join(process.cwd(), 'radio-cache', `podcast-${dateString}.mp3`);
  }

  /**
   * Check if today's podcast exists
   */
  @Get('today-podcast-exists')
  async checkTodayPodcastExists(): Promise<{ exists: boolean; date: string }> {
    const todayPath = this.getTodayPodcastPath();
    const exists = fs.existsSync(todayPath);
    return {
      exists,
      date: this.getTodayDateString(),
    };
  }

  @Get('latest-podcast')
  @Header('Content-Type', 'audio/mpeg')
  @Header(
    'Content-Disposition',
    'attachment; filename="chinese-learning-podcast.mp3"',
  )
  async getLatestPodcast(@UserID() userId: number): Promise<StreamableFile> {
    const todayPath = this.getTodayPodcastPath();
    const dateString = this.getTodayDateString();

    // Check if today's podcast already exists
    if (fs.existsSync(todayPath)) {
      console.log(`🎙️ Using cached podcast for ${dateString}`);
      const buffer = fs.readFileSync(todayPath);
      return new StreamableFile(buffer);
    }

    console.log(`🎙️ Generating new podcast for ${dateString}...`);

    // Build complete radio show
    const segments =
      await this.radioBuilderService.buildCompleteRadioShow(userId);
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

    // Ensure radio-cache directory exists
    const cacheDir = path.join(process.cwd(), 'radio-cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    console.log('🎙️ Concatenating audio files...');
    this.concatService.concat(audioFiles, todayPath);

    console.log('🎙️ Reading buffer...');
    const buffer = fs.readFileSync(todayPath);

    // Clean up individual segment files (but keep the final podcast)
    audioFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    console.log(`✅ Podcast generated and cached for ${dateString}`);
    return new StreamableFile(buffer);
  }

  @Post('hard-segment')
  @Header('Content-Type', 'audio/mpeg')
  async generateHardSegment(@UserID() userId: number): Promise<StreamableFile> {
    const segments = await this.templateService.buildHardSegments(userId);
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
