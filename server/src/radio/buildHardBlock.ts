import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TemplateHardService } from './services/templateHard.service';
import { RadioTtsService } from './services/tts.service';
import { ConcatService } from './services/concat.service';
import * as path from 'path';
import * as fs from 'fs';

interface Segment {
  lang?: string;
  text?: string;
  pause?: string;
}

// Hardcoded chunk limit (25 seconds) - but with 1 character, we won't need chunking
const CHUNK_MS = 25000;

function chunkSegments(segments: Segment[], maxMs: number): Segment[][] {
  const chunks: Segment[][] = [];
  const cur: Segment[] = [];
  let time = 0;

  for (const s of segments) {
    const est = s.pause ? parseInt(s.pause) : 600; // ~600ms per English phrase
    if (time + est > maxMs && cur.length) {
      chunks.push([...cur]);
      cur.length = 0;
      time = 0;
    }
    cur.push(s);
    time += est;
  }

  if (cur.length) chunks.push(cur);
  return chunks;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const templateService = app.get(TemplateHardService);
    const ttsService = app.get(RadioTtsService);
    const concatService = app.get(ConcatService);

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'radio-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Building hard segments (1 character for testing)...');
    const segs = await templateService.buildHardSegments();
    console.log(`Generated ${segs.length} segments for 1 character`, segs);
    return;

    const chunks = chunkSegments(segs, CHUNK_MS);
    console.log(`Split into ${chunks.length} chunks`);

    const mp3s: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating TTS for chunk ${i + 1}/${chunks.length}...`);
      mp3s.push(await ttsService.ssmlToMp3(chunks[i]));
    }

    console.log('Concatenating audio files...');
    const outputFile = path.join(outputDir, 'hardblock.mp3');
    concatService.concat(mp3s, outputFile);
    console.log('✅ Hard block ready → radio-output/hardblock.mp3');
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
