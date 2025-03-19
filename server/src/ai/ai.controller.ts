import { Controller, Post, Body, Header } from '@nestjs/common';
import { AiService } from './ai.service';
import { TtsRequestDto } from './dto/tts-request.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('tts')
  @Header('Content-Type', 'audio/mpeg')
  async generateSpeech(@Body() request: TtsRequestDto): Promise<Buffer> {
    return this.aiService.generateSpeech(request);
  }
}
