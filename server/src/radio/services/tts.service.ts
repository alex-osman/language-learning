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
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private segToSSML(seg: Segment): string {
    if (seg.pause) return `<break time="${seg.pause}"/>`;
    if (seg.lang === 'zh') return `<lang xml:lang="zh">${seg.text}</lang>`;
    return seg.text || '';
  }

  async ssmlToMp3(segments: Segment[]): Promise<string> {
    const ssml = `<speak>${segments.map((seg) => this.segToSSML(seg)).join(' ')}</speak>`;
    const hash = crypto.createHash('sha1').update(ssml).digest('hex');
    const file = path.join(this.cacheDir, `${hash}.mp3`);

    if (fs.existsSync(file)) return file;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await this.openai.audio.speech.create({
          model: 'tts-1', // Correct OpenAI model name
          voice: 'alloy',
          response_format: 'mp3',
          input: ssml,
        });

        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        return file;
      } catch (e) {
        if (attempt === 2) throw e;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    throw new Error('Failed to generate TTS after 3 attempts');
  }
}
