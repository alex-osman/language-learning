import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class BaseAiService {
  protected readonly openai: OpenAI;
  protected readonly CHAT_MODEL = 'gpt-4-turbo-preview';
  protected readonly TTS_MODEL = 'gpt-4o-mini-tts';
  protected readonly IMAGE_MODEL = 'gpt-image-1';
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
}
