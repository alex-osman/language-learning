import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class BaseAiService {
  protected readonly openai: OpenAI;
  protected readonly CHAT_MODEL = 'gpt-4-turbo-preview';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
}
