import { Injectable } from '@nestjs/common';

export interface SRTEntry {
  index: number;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  text: string;
}

export interface MultiFormatSRTEntry {
  index: number;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  simplifiedChinese: string;
  pinyin: string;
  english: string;
}

@Injectable()
export class SRTParserService {
  parseSRT(content: string): SRTEntry[] {
    const lines = content.split('\n');
    const entries: SRTEntry[] = [];
    let currentEntry: Partial<SRTEntry> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        // Empty line indicates end of entry
        if (currentEntry.index !== undefined) {
          entries.push(currentEntry as SRTEntry);
          currentEntry = {};
        }
        continue;
      }

      if (/^\d+$/.test(line)) {
        // Entry index
        currentEntry.index = parseInt(line);
      } else if (line.includes('-->')) {
        // Timestamp line
        const timeMatch = line.match(
          /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/,
        );
        if (timeMatch) {
          const [, startH, startM, startS, startMs, endH, endM, endS, endMs] =
            timeMatch;
          currentEntry.startTime = this.timeToMilliseconds(
            parseInt(startH),
            parseInt(startM),
            parseInt(startS),
            parseInt(startMs),
          );
          currentEntry.endTime = this.timeToMilliseconds(
            parseInt(endH),
            parseInt(endM),
            parseInt(endS),
            parseInt(endMs),
          );
        }
      } else {
        // Text content
        if (currentEntry.text) {
          currentEntry.text += '\n' + line;
        } else {
          currentEntry.text = line;
        }
      }
    }

    // Add the last entry if it exists
    if (currentEntry.index !== undefined) {
      entries.push(currentEntry as SRTEntry);
    }

    return entries;
  }

  /**
   * Parse multi-format SRT content that contains Traditional, Simplified, Pinyin, and English
   * Returns only Simplified Chinese, Pinyin, and English (skips Traditional)
   */
  parseMultiFormatSRT(content: string): MultiFormatSRTEntry[] {
    const lines = content.split('\n');
    const entries: MultiFormatSRTEntry[] = [];
    let currentEntry: Partial<MultiFormatSRTEntry> = {};
    let textLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        // Empty line indicates end of entry
        if (currentEntry.index !== undefined && textLines.length >= 4) {
          // Extract the 4 lines: Traditional (skip), Simplified, Pinyin, English
          currentEntry.simplifiedChinese = textLines[1] || ''; // Line 2: Simplified Chinese
          currentEntry.pinyin = textLines[2] || ''; // Line 3: Pinyin
          currentEntry.english = textLines[3] || ''; // Line 4: English

          entries.push(currentEntry as MultiFormatSRTEntry);
        }
        currentEntry = {};
        textLines = [];
        continue;
      }

      if (/^\d+$/.test(line)) {
        // Entry index
        currentEntry.index = parseInt(line);
      } else if (line.includes('-->')) {
        // Timestamp line
        const timeMatch = line.match(
          /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/,
        );
        if (timeMatch) {
          const [, startH, startM, startS, startMs, endH, endM, endS, endMs] =
            timeMatch;
          currentEntry.startTime = this.timeToMilliseconds(
            parseInt(startH),
            parseInt(startM),
            parseInt(startS),
            parseInt(startMs),
          );
          currentEntry.endTime = this.timeToMilliseconds(
            parseInt(endH),
            parseInt(endM),
            parseInt(endS),
            parseInt(endMs),
          );
        }
      } else {
        // Text content - collect all text lines for this entry
        textLines.push(line);
      }
    }

    // Add the last entry if it exists
    if (currentEntry.index !== undefined && textLines.length >= 4) {
      currentEntry.simplifiedChinese = textLines[1] || '';
      currentEntry.pinyin = textLines[2] || '';
      currentEntry.english = textLines[3] || '';
      entries.push(currentEntry as MultiFormatSRTEntry);
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
