import { Injectable } from '@nestjs/common';
import { BaseAiService } from './base-ai.service';
import { TtsRequestDto } from '../dto/tts-request.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class TtsAiService extends BaseAiService {
  private readonly speechDir = path.join(
    process.cwd(),
    '..',
    'client',
    'public',
    'assets',
    'speech',
  );

  constructor() {
    super();
    // Create the speech directory if it doesn't exist
    this.ensureSpeechDirExists();
  }

  private ensureSpeechDirExists(): void {
    if (!fs.existsSync(this.speechDir)) {
      fs.mkdirSync(this.speechDir, { recursive: true });
    }
  }

  private generateFilename(text: string, speed: string | undefined): string {
    // Create a hash of the text and speed to use as filename
    const speedValue = speed || 'normal'; // Default to 'normal' if speed is undefined
    const hash = crypto
      .createHash('md5')
      .update(`${text}_${speedValue}`)
      .digest('hex');
    return `${hash}.mp3`;
  }

  async generateSpeech(request: TtsRequestDto): Promise<Buffer> {
    // Generate a filename based on the request content
    const filename = this.generateFilename(request.text, request.speed);
    const filePath = path.join(this.speechDir, filename);

    // Check if the file already exists (caching)
    if (fs.existsSync(filePath)) {
      console.log(`Using cached speech file: ${filename}`);
      return fs.readFileSync(filePath);
    }

    // Generate the speech if it doesn't exist
    const response = await this.openai.audio.speech.create({
      model: this.TTS_MODEL,
      voice: 'echo',
      input: request.text,
      instructions:
        '你正在给一个只学会了一些基础词语的小朋友讲故事。请说得慢一些，清楚一些。',
      speed: 1,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    // Save the audio file to the assets folder
    try {
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved speech file: ${filename}`);
    } catch (error) {
      console.error('Error saving speech file:', error);
    }

    return buffer;
  }
}
