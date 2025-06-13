import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SilenceService {
  private readonly cacheDir = path.join(
    process.cwd(),
    'radio-cache',
    'silence',
  );

  constructor() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  createSilence(duration: string): string {
    const file = path.join(
      this.cacheDir,
      `silence_${duration.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`,
    );

    if (fs.existsSync(file)) return file;

    // Convert duration to seconds for FFmpeg
    const seconds = this.parseDurationToSeconds(duration);

    // Generate silence using FFmpeg
    execSync(
      `ffmpeg -f lavfi -i anullsrc=r=24000:cl=mono -t ${seconds} -c:a mp3 -b:a 160k "${file}"`,
    );

    return file;
  }

  private parseDurationToSeconds(duration: string): number {
    if (duration.endsWith('ms')) {
      return parseInt(duration.slice(0, -2)) / 1000;
    } else if (duration.endsWith('s')) {
      return parseFloat(duration.slice(0, -1));
    }
    throw new Error(`Unsupported duration format: ${duration}`);
  }
}
