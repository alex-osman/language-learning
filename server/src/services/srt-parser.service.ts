import { Injectable } from '@nestjs/common';

export interface SRTEntry {
  index: number;
  startTime: number; // milliseconds
  endTime: number; // milliseconds
  text: string;
}

@Injectable()
export class SRTParserService {
  /**
   * Parse SRT file content and return array of subtitle entries
   */
  parseSRT(content: string): SRTEntry[] {
    const entries: SRTEntry[] = [];
    const blocks = content.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      // Parse index
      const index = parseInt(lines[0].trim());
      if (isNaN(index)) continue;

      // Parse timing line (e.g., "00:02:21,265 --> 00:02:29,331")
      const timingMatch = lines[1].match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/,
      );
      if (!timingMatch) continue;

      const startTime = this.timeToMilliseconds(
        parseInt(timingMatch[1]), // hours
        parseInt(timingMatch[2]), // minutes
        parseInt(timingMatch[3]), // seconds
        parseInt(timingMatch[4]), // milliseconds
      );

      const endTime = this.timeToMilliseconds(
        parseInt(timingMatch[5]), // hours
        parseInt(timingMatch[6]), // minutes
        parseInt(timingMatch[7]), // seconds
        parseInt(timingMatch[8]), // milliseconds
      );

      // Combine all text lines (subtitle may span multiple lines)
      const text = lines.slice(2).join(' ').trim();

      // Skip empty text entries
      if (!text) continue;

      entries.push({
        index,
        startTime,
        endTime,
        text,
      });
    }

    return entries;
  }

  /**
   * Convert time components to milliseconds
   */
  private timeToMilliseconds(
    hours: number,
    minutes: number,
    seconds: number,
    milliseconds: number,
  ): number {
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
  }

  /**
   * Extract scene ID from filename (e.g., "33.srt" -> 33)
   */
  extractSceneIdFromFilename(filename: string): number | null {
    const match = filename.match(/^(\d+)\.srt$/i);
    return match ? parseInt(match[1]) : null;
  }
}
