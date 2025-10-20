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
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async textToMp3(text: string, lang: 'en' | 'zh'): Promise<string> {
    // Create cache key based on text and language
    const cacheKey = `${lang}_${crypto.createHash('sha1').update(text).digest('hex')}`;
    const file = path.join(this.cacheDir, `${cacheKey}.mp3`);

    if (fs.existsSync(file)) return file;

    for (let attempt = 0; attempt < 3; attempt++) {
      console.log(
        '🔊 Attempting to generate TTS for segment, attempt:',
        attempt,
      );
      try {
        const res = await this.openai.audio.speech.create({
          model: this.TTS_MODEL, // Correct OpenAI TTS model name
          voice: 'alloy', // Could vary by language if needed
          response_format: 'mp3',
          input: text, // Plain text, no SSML
          // Note: instructions parameter is not supported by OpenAI TTS API
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
