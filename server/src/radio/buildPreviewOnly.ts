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

    console.log('🔮 Generating preview segment for next character...');
    const segments = await radioBuilderService.buildPreviewOnly();

    if (segments.length === 0) {
      console.log(
        'ℹ️ No preview segment generated - all characters have movies',
      );
      console.log(
        '💡 Create some characters without movies to test the preview feature',
      );
      return;
    }

    console.log(`🎵 Processing ${segments.length} preview segments...`);
    const audioFiles: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(
        `Processing segment ${i + 1}/${segments.length}: ${segment.type}`,
      );

      if (segment.type === 'text') {
        // Generate TTS for text
        const mp3File = await ttsService.textToMp3(
          segment.content!,
          segment.lang!,
        );
        audioFiles.push(mp3File);
      } else if (segment.type === 'pause') {
        // Generate silence for pause
        const silenceFile = silenceService.createSilence(segment.duration!);
        audioFiles.push(silenceFile);
      }
    }

    console.log('🎧 Concatenating preview segments...');
    const outputFile = path.join(outputDir, 'preview.mp3');
    concatService.concat(audioFiles, outputFile);

    console.log('✅ Preview segment ready → radio-output/preview.mp3');
    console.log(
      `📊 Generated from ${audioFiles.length} individual audio segments`,
    );
    console.log('🔮 Features: AI DJ preview, next character teaser!');
  } catch (error) {
    console.error('❌ Error building preview segment:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
