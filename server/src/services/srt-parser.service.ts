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
   * Parse multi-format SRT content that contains Simplified, Pinyin, and English
   * Handles both 3-line format (Pinyin, Simplified Chinese, English) and 4-line format (Traditional, Simplified, Pinyin, English)
   * Automatically detects the format based on the number of text lines
   */
  parseMultiFormatSRT(content: string): MultiFormatSRTEntry[] {
    const lines = content.split('\n');
    const entries: MultiFormatSRTEntry[] = [];
    let currentEntry: Partial<MultiFormatSRTEntry> = {};
    let textLines: string[] = [];
    let allFirstLines: string[] = []; // Collect first lines from multiple entries

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        // Empty line indicates end of entry
        if (currentEntry.index !== undefined && textLines.length >= 3) {
          // Collect the first line of this entry for format detection
          allFirstLines.push(textLines[0]);

          if (textLines.length === 3) {
            // 3-line format: Pinyin, Simplified Chinese, English
            currentEntry.pinyin = textLines[0] || ''; // Line 1: Pinyin
            currentEntry.simplifiedChinese = textLines[1] || ''; // Line 2: Simplified Chinese
            currentEntry.english = textLines[2] || ''; // Line 3: English
          } else if (textLines.length >= 4) {
            // 4-line format: Traditional, Simplified, Pinyin, English
            // Determine the format by checking multiple first lines
            const isSimplifiedFirst =
              this.isSimplifiedChineseFromMultipleLines(allFirstLines);

            if (isSimplifiedFirst) {
              // Format: Simplified, Traditional, Pinyin, English
              currentEntry.simplifiedChinese = textLines[0] || ''; // Line 1: Simplified Chinese
              currentEntry.pinyin = textLines[2] || ''; // Line 3: Pinyin
              currentEntry.english = textLines[3] || ''; // Line 4: English
            } else {
              // Format: Traditional, Simplified, Pinyin, English
              currentEntry.simplifiedChinese = textLines[1] || ''; // Line 2: Simplified Chinese
              currentEntry.pinyin = textLines[2] || ''; // Line 3: Pinyin
              currentEntry.english = textLines[3] || ''; // Line 4: English
            }
          }

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
    if (currentEntry.index !== undefined && textLines.length >= 3) {
      allFirstLines.push(textLines[0]);

      if (textLines.length === 3) {
        // 3-line format: Pinyin, Simplified Chinese, English
        currentEntry.pinyin = textLines[0] || '';
        currentEntry.simplifiedChinese = textLines[1] || '';
        currentEntry.english = textLines[2] || '';
      } else if (textLines.length >= 4) {
        // 4-line format: Traditional, Simplified, Pinyin, English
        const isSimplifiedFirst =
          this.isSimplifiedChineseFromMultipleLines(allFirstLines);

        if (isSimplifiedFirst) {
          // Format: Simplified, Traditional, Pinyin, English
          currentEntry.simplifiedChinese = textLines[0] || '';
          currentEntry.pinyin = textLines[2] || '';
          currentEntry.english = textLines[3] || '';
        } else {
          // Format: Traditional, Simplified, Pinyin, English
          currentEntry.simplifiedChinese = textLines[1] || '';
          currentEntry.pinyin = textLines[2] || '';
          currentEntry.english = textLines[3] || '';
        }
      }

      entries.push(currentEntry as MultiFormatSRTEntry);
    }

    return entries;
  }

  /**
   * Check if a string contains Simplified Chinese characters
   */
  private isSimplifiedChinese(text: string): boolean {
    // Look for Simplified Chinese characters (simpler forms)
    const simplifiedPattern =
      /[备们个来时间问题现实际际应该专业业务务项发现实]/;
    // Look for Traditional Chinese characters (more complex forms)
    const traditionalPattern =
      /[備們個來時間問題現實際際應該專業業務務項發現實]/;

    return simplifiedPattern.test(text) && !traditionalPattern.test(text);
  }

  /**
   * Check if Simplified Chinese comes first by analyzing multiple first lines
   * This provides more reliable detection than checking just one line
   */
  private isSimplifiedChineseFromMultipleLines(firstLines: string[]): boolean {
    // Concatenate all first lines to get a larger sample
    const combinedText = firstLines.join('');

    // Look for Simplified Chinese characters (simpler forms)
    const simplifiedPattern =
      /[备们个来时间问题现实际际应该专业业务务项发现实]/;
    // Look for Traditional Chinese characters (more complex forms)
    const traditionalPattern =
      /[備們個來時間問題現實際際應該專業業務務項發現實]/;

    const hasSimplified = simplifiedPattern.test(combinedText);
    const hasTraditional = traditionalPattern.test(combinedText);

    // If we have both, prefer Simplified (more common in modern content)
    if (hasSimplified && hasTraditional) {
      return true;
    }

    // If we only have Simplified, it's definitely Simplified-first
    if (hasSimplified && !hasTraditional) {
      return true;
    }

    // If we only have Traditional, it's Traditional-first
    if (!hasSimplified && hasTraditional) {
      return false;
    }

    // If we have neither specific pattern, check for any Chinese characters
    // and use a broader heuristic
    const anyChinesePattern = /[\u4e00-\u9fff]/;
    if (anyChinesePattern.test(combinedText)) {
      // For broader detection, look for common Simplified vs Traditional differences
      const commonSimplified = /[这那说见现发]/;
      const commonTraditional = /[這那說見現發]/;

      const hasCommonSimplified = commonSimplified.test(combinedText);
      const hasCommonTraditional = commonTraditional.test(combinedText);

      if (hasCommonSimplified && !hasCommonTraditional) {
        return true;
      }
      if (!hasCommonSimplified && hasCommonTraditional) {
        return false;
      }
    }

    // Default to Simplified-first (more common in modern content)
    return true;
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
