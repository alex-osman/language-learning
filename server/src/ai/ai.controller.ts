import { Controller, Post, Body, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { AiService } from './ai.service';
import { TtsRequestDto } from './dto/tts-request.dto';

@Controller('/api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('tts')
  async generateSpeech(
    @Body() request: TtsRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    const audioBuffer = await this.aiService.generateSpeech(request);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });

    res.send(audioBuffer);
  }
}
