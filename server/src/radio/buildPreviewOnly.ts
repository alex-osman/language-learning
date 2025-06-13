import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TemplatePreviewService } from './services/templatePreview.service';
import { RadioTtsService } from './services/tts.service';
import { SilenceService } from './services/silence.service';
import { ConcatService } from './services/concat.service';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const templateService = app.get(TemplatePreviewService);
    const ttsService = app.get(RadioTtsService);
    const silenceService = app.get(SilenceService);
    const concatService = app.get(ConcatService);

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'radio-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get character count from command line argument (default: 5)
    const args = process.argv.slice(2);
    const countArg = args.find((arg) => arg.startsWith('--count='));
    const count = countArg ? parseInt(countArg.split('=')[1]) : 4;

    console.log(`🎙️ Building preview for ${count} character(s)...`);

    // Use multi-character preview if count > 1, otherwise single character
    const segments =
      count > 1
        ? await templateService.buildMultiCharacterPreviewSegments(count)
        : await templateService.buildPreviewSegments();

    if (segments.length === 0) {
      console.log('❌ No characters available for preview');
      process.exit(0);
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
    const outputFile = path.join(outputDir, `preview-${count}chars.mp3`);
    concatService.concat(audioFiles, outputFile);

    console.log(`✅ Preview ready → ${outputFile}`);
    console.log(
      `📊 Generated from ${audioFiles.length} individual audio segments`,
    );

    // Get file stats for duration info
    const stats = fs.statSync(outputFile);
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Error building preview:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
