import { Injectable } from '@nestjs/common';
import { BaseAiService } from './base-ai.service';
import { TtsRequestDto } from '../dto/tts-request.dto';

@Injectable()
export class TtsAiService extends BaseAiService {
  async generateSpeech(request: TtsRequestDto): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'coral',
      input: request.text,
      speed: 0.9,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }
}
