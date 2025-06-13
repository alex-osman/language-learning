# Radio Segment MVP Plan v3 - Non-SSML Approach

This updated plan handles TTS services that don't support SSML by:
- Sending separate TTS requests for each language segment
- Generating individual MP3 files per segment
- Creating silence files for pauses
- Concatenating everything in precise order

## Key Changes from v2:
- ❌ No SSML - separate requests per language
- ✅ Individual MP3 generation per text segment
- ✅ Manual pause/silence generation
- ✅ Precise concatenation control
- ✅ Better caching (per individual segment)

---

## 0  Folder layout (unchanged)

```
server/
├─ src/radio/
│   ├─ services/
│   │   ├─ hardWordsQuery.service.ts      # step 1 - database query
│   │   ├─ templateHard.service.ts        # step 2 - segment template
│   │   ├─ tts.service.ts                 # step 3 - individual TTS calls
│   │   ├─ silence.service.ts             # step 4 - pause generation
│   │   └─ concat.service.ts              # step 5 - precise concatenation
│   ├─ radio.controller.ts
│   └─ buildHardBlock.ts
├─ radio-cache/                           # Individual segment cache
│   ├─ tts/                              # Text-to-speech cache
│   └─ silence/                          # Silence files cache
├─ radio-output/
│   └─ hardblock.mp3
```

---

## 1  hardWordsQuery.service.ts (unchanged)

Same as v2 - still queries hardest character(s) from database.

---

## 2  templateHard.service.ts (NEW approach)

```typescript
import { Injectable } from '@nestjs/common';
import { HardWordsQueryService } from './hardWordsQuery.service';
import { CharacterService } from '../../services/character.service';

export interface AudioSegment {
  type: 'text' | 'pause';
  content?: string;
  lang?: 'en' | 'zh';
  duration?: string; // for pauses: "700ms", "1s"
}

@Injectable()
export class TemplateHardService {
  constructor(
    private hardWordsQueryService: HardWordsQueryService,
    private characterService: CharacterService,
  ) {}

  private readonly ord = ["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth"];

  // Hardcoded config values
  private readonly SHORT_PAUSE = "700ms";
  private readonly LONG_PAUSE = "1s";

  async buildHardSegments(): Promise<AudioSegment[]> {
    const words = await this.hardWordsQueryService.getHardest();
    const segments: AudioSegment[] = [];

    words.forEach((w, i) => {
      const toneNumber = this.characterService.getToneNumber(w.pinyin);
      const pinyinNoTones = this.characterService.removeToneMarks(w.pinyin);

      // 1. "First character"
      segments.push({type: 'text', content: `${this.ord[i]} character.`, lang: 'en'});
      segments.push({type: 'pause', duration: this.SHORT_PAUSE});

      // 2. Chinese character
      segments.push({type: 'text', content: w.character, lang: 'zh'});
      segments.push({type: 'pause', duration: '500ms'});

      // 3. Spell pinyin letters (no SSML, just spell them out)
      const spelledPinyin = pinyinNoTones.split('').join(' '); // "ma" -> "m a"
      segments.push({type: 'text', content: spelledPinyin, lang: 'en'});
      segments.push({type: 'pause', duration: '300ms'});

      // 4. Tone number
      segments.push({type: 'text', content: `tone ${toneNumber}`, lang: 'en'});
      segments.push({type: 'pause', duration: '500ms'});

      // 5. Chinese character again
      segments.push({type: 'text', content: w.character, lang: 'zh'});
      segments.push({type: 'pause', duration: this.SHORT_PAUSE});

      // 6. English meaning
      segments.push({type: 'text', content: `Means ${w.definition}`, lang: 'en'});
      segments.push({type: 'pause', duration: this.LONG_PAUSE});
    });

    return segments;
  }
}
```

---

## 3  tts.service.ts (NEW - Individual calls)

```typescript
import { Injectable } from '@nestjs/common';
import { BaseAiService } from '../../ai/services/base-ai.service';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class RadioTtsService extends BaseAiService {
  private readonly cacheDir = path.join(process.cwd(), 'radio-cache', 'tts');

  constructor() {
    super();
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, {recursive: true});
    }
  }

  async textToMp3(text: string, lang: 'en' | 'zh'): Promise<string> {
    // Create cache key based on text and language
    const cacheKey = `${lang}_${crypto.createHash('sha1').update(text).digest('hex')}`;
    const file = path.join(this.cacheDir, `${cacheKey}.mp3`);

    if (fs.existsSync(file)) return file;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await this.openai.audio.speech.create({
          model: 'tts-1',
          voice: 'alloy', // Could vary by language if needed
          response_format: 'mp3',
          input: text, // Plain text, no SSML
        });

        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        return file;
      } catch (e) {
        if (attempt === 2) throw e;
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    throw new Error('Failed to generate TTS after 3 attempts');
  }
}
```

---

## 4  silence.service.ts (NEW - Pause generation)

```typescript
import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SilenceService {
  private readonly cacheDir = path.join(process.cwd(), 'radio-cache', 'silence');

  constructor() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, {recursive: true});
    }
  }

  createSilence(duration: string): string {
    const file = path.join(this.cacheDir, `silence_${duration.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`);

    if (fs.existsSync(file)) return file;

    // Convert duration to seconds for FFmpeg
    const seconds = this.parseDurationToSeconds(duration);

    // Generate silence using FFmpeg
    execSync(`ffmpeg -f lavfi -i anullsrc=r=24000:cl=mono -t ${seconds} -c:a mp3 -b:a 160k "${file}"`);

    return file;
  }

  private parseDurationToSeconds(duration: string): number {
    if (duration.endsWith('ms')) {
      return parseInt(duration.slice(0, -2)) / 1000;
    } else if (duration.endsWith('s')) {
      return parseFloat(duration.slice(0, -1));
    }
    throw new Error(`Unsupported duration format: ${duration}`);
  }
}
```

---

## 5  concat.service.ts (UPDATED - handles mixed files)

```typescript
import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConcatService {
  concat(files: string[], outfile: string): void {
    // Ensure all files exist
    files.forEach(file => {
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }
    });

    // Use full paths in concat file
    const safe = files.map(f => `file '${path.resolve(f)}'`).join("\n");
    fs.writeFileSync("concat.txt", safe);
    execSync(`ffmpeg -y -f concat -safe 0 -i concat.txt -c copy ${outfile}`);
    fs.unlinkSync("concat.txt");
  }
}
```

---

## 6  buildHardBlock.ts (UPDATED - orchestrates new flow)

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TemplateHardService, AudioSegment } from './services/templateHard.service';
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
      fs.mkdirSync(outputDir, {recursive: true});
    }

    console.log('Building hard segments (1 character for testing)...');
    const segments = await templateService.buildHardSegments();

    console.log(`Processing ${segments.length} segments...`);
    const audioFiles: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(`Processing segment ${i + 1}/${segments.length}: ${segment.type}`);

      if (segment.type === 'text') {
        // Generate TTS for text
        const mp3File = await ttsService.textToMp3(segment.content!, segment.lang!);
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
    console.log(`📊 Generated from ${audioFiles.length} individual audio segments`);
    console.log('💡 To test with more characters, modify hardWordsQuery.service.ts getHardest() default parameter');
  } catch (error) {
    console.error('❌ Error building hard block:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
```

---

## 7  Updated radio.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../entities/character.entity';
import { HardWordsQueryService } from './services/hardWordsQuery.service';
import { TemplateHardService } from './services/templateHard.service';
import { RadioTtsService } from './services/tts.service';
import { SilenceService } from './services/silence.service'; // NEW
import { ConcatService } from './services/concat.service';
import { RadioController } from './radio.controller';
import { CharacterService } from '../services/character.service';
import { ActorService } from '../services/actor.service';
import { SetService } from '../services/set.service';
import { RadicalPropService } from '../services/radical-prop.service';
import { Actor } from '../entities/actor.entity';
import { Set } from '../entities/set.entity';
import { RadicalProp } from '../entities/radical-prop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Character, Actor, Set, RadicalProp])],
  providers: [
    HardWordsQueryService,
    TemplateHardService,
    RadioTtsService,
    SilenceService, // NEW
    ConcatService,
    CharacterService,
    ActorService,
    SetService,
    RadicalPropService,
  ],
  controllers: [RadioController],
  exports: [
    HardWordsQueryService,
    TemplateHardService,
    RadioTtsService,
    SilenceService, // NEW
    ConcatService,
  ],
})
export class RadioModule {}
```

---

## Benefits of Non-SSML Approach:

1. **Universal Compatibility**: Works with any TTS service
2. **Better Caching**: Individual segments cached separately
3. **Precise Timing**: Exact control over pause durations
4. **Language Flexibility**: Can use different voices per language
5. **Debugging**: Easier to debug individual segments
6. **Reusability**: Text segments can be reused across different audio outputs

## Trade-offs:

- **More API Calls**: Each text segment = separate TTS request
- **Slightly More Complex**: More files to manage and concatenate
- **Higher Initial Cost**: More requests for first generation (but better caching)

The caching system ensures that repeated text segments (like "First character", "tone 1", etc.) are only generated once and reused across multiple runs.
