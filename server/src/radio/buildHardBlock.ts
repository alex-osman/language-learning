import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import {
  TemplateHardService,
  AudioSegment,
} from './services/templateHard.service';
import { RadioTtsService } from './services/tts.service';
import { SilenceService } from './services/silence.service';
import { ConcatService } from './services/concat.service';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const templateService = app.get(TemplateHardService);
    const ttsService = app.get(RadioTtsService);
    const silenceService = app.get(SilenceService);
    const concatService = app.get(ConcatService);

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'radio-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Building hard segments (1 character for testing)...');
    const segments = await templateService.buildHardSegments();

    console.log(`Processing ${segments.length} segments...`);
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

    console.log('Concatenating all audio segments...');
    const outputFile = path.join(outputDir, 'hardblock.mp3');
    concatService.concat(audioFiles, outputFile);

    console.log('✅ Hard block ready → radio-output/hardblock.mp3');
    console.log(
      `📊 Generated from ${audioFiles.length} individual audio segments`,
    );
    console.log(
      '💡 To test with more characters, modify hardWordsQuery.service.ts getHardest() default parameter',
    );
  } catch (error) {
    console.error('❌ Error building hard block:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
