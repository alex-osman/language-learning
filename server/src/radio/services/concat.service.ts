import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConcatService {
  concat(files: string[], outfile: string): void {
    // Ensure all files exist
    files.forEach((file) => {
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }
    });

    // Use full paths instead of just basenames to fix FFmpeg path issue
    const safe = files.map((f) => `file '${path.resolve(f)}'`).join('\n');
    fs.writeFileSync('concat.txt', safe);
    execSync(`ffmpeg -y -f concat -safe 0 -i concat.txt -c copy ${outfile}`);
    fs.unlinkSync('concat.txt');
  }
}
