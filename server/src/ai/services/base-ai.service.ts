import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class BaseAiService {
  protected readonly openai: OpenAI;
  protected readonly CHAT_MODEL = 'gpt-5.5';
  protected readonly TTS_MODEL = 'gpt-4o-mini-tts';
  protected readonly IMAGE_MODEL = 'gpt-image-2';
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
}
