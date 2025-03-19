import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { TtsRequestDto } from './dto/tts-request.dto';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;

  constructor() {
    console.log('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateSpeech(request: TtsRequestDto): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'fable',
      input: request.text,
      speed: request.speed === 'slow' ? 0.7 : 1.0,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }
}
