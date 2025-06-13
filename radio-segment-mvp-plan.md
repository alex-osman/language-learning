# plan.md – Hard‑Word Segment Builder **v2**

This markdown captures the updated pipeline for **only** the Hard‑Word block. Key updates:

* Interface with database instead of data/words.json
* Hardcoded config values (no separate JSON files)
* Guard against empty deck
* Pronunciation pattern: **say word → spell pinyin letters → say "tone #" → say word again**
* SSML `<say-as>` for letter spelling
* Correct OpenAI model names (`tts-1`)
* OpenAI API key from environment variable
* Retry logic & cache dirs
* Use existing tone extraction logic from character service

---

## 0  Folder layout

```
server/
├─ src/
│   ├─ ai/
│   │   └─ services/
│   │       └─ (existing AI services...)
│   ├─ radio/                    # NEW: Radio segment generation
│   │   ├─ services/
│   │   │   ├─ hardWordsQuery.service.ts    # step 1 - database query
│   │   │   ├─ templateHard.service.ts      # step 2 - SSML template
│   │   │   ├─ tts.service.ts               # step 3 (cache + retry)
│   │   │   └─ concat.service.ts            # step 4
│   │   ├─ radio.controller.ts              # API endpoints
│   │   └─ buildHardBlock.ts                # CLI orchestrator script
│   └─ (other existing directories...)
├─ radio-cache/                  # hashed MP3 chunks (auto mkdir)
├─ radio-output/
│   └─ hardblock.mp3
└─ (other existing server files...)
```

**Integration Points:**
- Uses existing database connection from main app
- Leverages existing `BaseAiService` for OpenAI setup
- Can reuse existing TypeORM repositories
- Follows NestJS service/controller pattern
- CLI script can be run with `npm run build && node dist/radio/buildHardBlock.js`

---

## 1  hardWordsQuery.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Character } from '../../entities/character.entity';

@Injectable()
export class HardWordsQueryService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
  ) {}

  async getHardest(count = 10): Promise<Character[]> {
    // Get characters with spaced repetition data (like flashcard service does)
    const pool = await this.characterRepository.find({
      where: {
        movie: Not(IsNull()),
        easinessFactor: Not(IsNull()),
      },
      order: {
        easinessFactor: 'ASC', // Lower easiness = harder
      },
      take: count,
    });

    if (pool.length === 0) {
      throw new Error("No characters in database with spaced repetition data");
    }

    return pool;
  }
}
```

---

## 2  templateHard.service.ts  (pronunciation pattern with SSML `<say-as>`)

```typescript
import { Injectable } from '@nestjs/common';
import { HardWordsQueryService } from './hardWordsQuery.service';
import { CharacterService } from '../../services/character.service';
import { Character } from '../../entities/character.entity';

interface Segment {
  lang?: string;
  text?: string;
  pause?: string;
}

@Injectable()
export class TemplateHardService {
  constructor(
    private hardWordsQueryService: HardWordsQueryService,
    private characterService: CharacterService, // Reuse existing service
  ) {}

  private readonly ord = ["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth"];

  // Hardcoded config values
  private readonly SHORT_PAUSE = "700ms";
  private readonly LONG_PAUSE = "1s";

  async buildHardSegments(): Promise<Segment[]> {
    const words = await this.hardWordsQueryService.getHardest();
    const segs: Segment[] = [];

    words.forEach((w, i) => {
      // Use existing CharacterService methods instead of duplicating logic
      const toneNumber = this.characterService.getToneNumber(w.pinyin);
      const pinyinNoTones = this.characterService.removeToneMarks(w.pinyin);

      segs.push({lang:"en", text:`${this.ord[i]} character.`});
      segs.push({pause: this.SHORT_PAUSE});

      // word once (Mandarin)
      segs.push({lang:"zh", text: w.character});
      segs.push({pause:"500ms"});

      // spell pinyin letters via SSML <say-as interpret-as="characters">
      const spelled = `<say-as interpret-as="characters">${pinyinNoTones}</say-as>`;
      segs.push({lang:"en", text: spelled});
      segs.push({pause:"300ms"});
      segs.push({lang:"en", text:`tone ${toneNumber}.`});
      segs.push({pause:"500ms"});

      // word again
      segs.push({lang:"zh", text: w.character});
      segs.push({pause: this.SHORT_PAUSE});

      // English meaning
      segs.push({lang:"en", text:`Means ${w.definition}.`});
      segs.push({pause: this.LONG_PAUSE});
    });

    return segs;
  }
}
```

---

## 3  tts.service.ts  (cache, retry, mkdir)

```typescript
import { Injectable } from '@nestjs/common';
import { BaseAiService } from '../../ai/services/base-ai.service';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

interface Segment {
  lang?: string;
  text?: string;
  pause?: string;
}

@Injectable()
export class RadioTtsService extends BaseAiService {
  private readonly cacheDir = path.join(process.cwd(), 'radio-cache');

  constructor() {
    super();
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, {recursive: true});
    }
  }

  private segToSSML(seg: Segment): string {
    if (seg.pause) return `<break time="${seg.pause}"/>`;
    if (seg.lang === "zh") return `<lang xml:lang="zh">${seg.text}</lang>`;
    return seg.text;
  }

  async ssmlToMp3(segments: Segment[]): Promise<string> {
    const ssml = `<speak>${segments.map(seg => this.segToSSML(seg)).join(" ")}</speak>`;
    const hash = crypto.createHash("sha1").update(ssml).digest("hex");
    const file = path.join(this.cacheDir, `${hash}.mp3`);

    if (fs.existsSync(file)) return file;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await this.openai.audio.speech.create({
          model: "tts-1", // Correct OpenAI model name
          voice: "alloy",
          format: "mp3",
          input: ssml
        });

        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        return file;
      } catch (e) {
        if (attempt === 2) throw e;
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
}
```

---

## 4  concat.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConcatService {
  concat(files: string[], outfile: string): void {
    const safe = files.map(f => `file '${path.basename(f)}'`).join("\n");
    fs.writeFileSync("concat.txt", safe);
    execSync(`ffmpeg -y -f concat -safe 0 -i concat.txt -c copy ${outfile}`);
    fs.unlinkSync("concat.txt");
  }
}
```

---

## 5  buildHardBlock.ts (CLI Script)

```typescript
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

// Hardcoded chunk limit (25 seconds)
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
      fs.mkdirSync(outputDir, {recursive: true});
    }

    const segs = await templateService.buildHardSegments();
    const chunks = chunkSegments(segs, CHUNK_MS);
    const mp3s: string[] = [];

    for (const chunk of chunks) {
      mp3s.push(await ttsService.ssmlToMp3(chunk));
    }

    const outputFile = path.join(outputDir, 'hardblock.mp3');
    concatService.concat(mp3s, outputFile);
    console.log("Hard block ready → radio-output/hardblock.mp3");
  } catch (error) {
    console.error("Error building hard block:", error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
```

---

## 6  radio.controller.ts (Optional API endpoint)

```typescript
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
```

---

## MVP success criterion

Running `npm run build && node dist/radio/buildHardBlock.js` produces an MP3 where **each character is heard three times**:

1. Chinese character
2. Spelled pinyin letters (using SSML) + "tone #"
3. Chinese character again
   Plus English meaning, with accurate pauses and caching

The system now properly integrates with the existing NestJS backend architecture.
