import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

// gpt-5.5 does NOT support: temperature, max_tokens, top_p, presence_penalty, frequency_penalty
// Use max_completion_tokens instead of max_tokens.
// New params: reasoning.effort (none|low|medium|high|xhigh), verbosity (low|medium|high)
type UnsupportedGpt55Params = 'temperature' | 'max_tokens' | 'top_p' | 'presence_penalty' | 'frequency_penalty';
export type Gpt55ChatParams = Omit<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, UnsupportedGpt55Params>;

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

  // Use this instead of this.openai.chat.completions.create() directly —
  // it enforces gpt-5.5-compatible params at compile time.
  protected chat(params: Gpt55ChatParams) {
    return this.openai.chat.completions.create(params as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
  }
}
