import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RadioBuilderService } from './services/radioBuilder.service';
import { RadioTtsService } from './services/tts.service';
import { SilenceService } from './services/silence.service';
import { ConcatService } from './services/concat.service';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const radioBuilderService = app.get(RadioBuilderService);
    const ttsService = app.get(RadioTtsService);
    const silenceService = app.get(SilenceService);
    const concatService = app.get(ConcatService);

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'radio-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('📻 Generating complete radio show (Hard Words + Preview)...');
    const segments = await radioBuilderService.buildCompleteRadioShow();

    console.log(`🎵 Processing ${segments.length} total segments...`);
    const audioFiles: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(
        `Processing segment ${i + 1}/${segments.length}: ${segment.type}`,
      );

      if (segment.type === 'text') {
        // Generate TTS for text
        console.log('🔊 Generating TTS for segment...');
        const mp3File = await ttsService.textToMp3(
          segment.content!,
          segment.lang!,
        );
        console.log('🔊 TTS generated for segment');
        audioFiles.push(mp3File);
      } else if (segment.type === 'pause') {
        // Generate silence for pause
        const silenceFile = silenceService.createSilence(segment.duration!);
        audioFiles.push(silenceFile);
      }
    }

    console.log('🎧 Concatenating complete radio show...');
    const outputFile = path.join(outputDir, 'complete-show.mp3');
    concatService.concat(audioFiles, outputFile);

    console.log(
      '✅ Complete radio show ready → radio-output/complete-show.mp3',
    );
    console.log(
      `📊 Generated from ${audioFiles.length} individual audio segments`,
    );
    console.log('📻 Features: Hard words review + Next character preview!');
    console.log(
      '💡 Individual segments also available: hardblock.mp3, preview.mp3',
    );
  } catch (error) {
    console.error('❌ Error building complete radio show:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
