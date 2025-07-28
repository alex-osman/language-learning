import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../entities/episode.entity';
import { Season } from '../entities/season.entity';
import { Media } from '../entities/media.entity';
import { SRTParserService } from './srt-parser.service';
import { SentenceService } from './sentence.service';
import { EpisodeService } from './episode.service';
import { MovieAiService } from '../ai/services/movie.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { SentenceAnalyzerService } from './sentence-analyzer.service';
import { Sentence } from 'src/entities/sentence.entity';

interface YouTubeSubtitleFormat {
  ext: string;
  url: string;
  name: string;
}

interface YouTubeMetadata {
  title: string;
  subtitles: { [key: string]: YouTubeSubtitleFormat[] };
  automatic_captions: { [key: string]: YouTubeSubtitleFormat[] };
}

const execAsync = promisify(exec);

export interface YouTubeImportOptions {
  youtubeUrl: string;
  seasonId: number;
  title?: string;
  preferredLanguage?: string; // Default: 'zh' for Chinese
  userId?: number;
  dryRun?: boolean; // If true, preview only without importing
}

export interface YouTubeImportResult {
  episode: Episode | null;
  sentencesImported: number;
  videoUrl: string;
  success: boolean;
  message: string;
  // Dry run preview data
  previewData?: {
    videoTitle: string;
    availableSubtitles: string[];
    subtitlePreviews: Array<{
      language: string;
      filename: string;
      preview: string;
      entryCount: number;
      isMultiFormat?: boolean;
      contentAnalysis?: string;
    }>;
    parsedEntries: number;
  };
}

@Injectable()
export class YouTubeImportService {
  private readonly logger = new Logger(YouTubeImportService.name);

  constructor(
    @InjectRepository(Episode)
    private episodeRepository: Repository<Episode>,
    private srtParser: SRTParserService,
    private sentenceService: SentenceService,
    private episodeService: EpisodeService,
    private movieAiService: MovieAiService,
    private sentenceAnalyzerService: SentenceAnalyzerService,
  ) {}

  /**
   * Check if yt-dlp is properly installed and accessible
   */
  private async checkYtDlpInstallation(): Promise<void> {
    try {
      this.logger.log('Checking yt-dlp installation...');
      const { stdout } = await execAsync('yt-dlp --version');
      this.logger.log(`yt-dlp version: ${stdout.trim()}`);
    } catch (error) {
      this.logger.error(`yt-dlp is not properly installed: ${error.message}`);
      throw new Error(
        'yt-dlp is not installed or not accessible. Please install it using: brew install yt-dlp (macOS) or pip install yt-dlp',
      );
    }
  }

  async importFromYouTube(
    options: YouTubeImportOptions,
  ): Promise<YouTubeImportResult> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'youtube-import-'));

    try {
      this.logger.log(`Starting YouTube import for: ${options.youtubeUrl}`);
      if (options.dryRun) {
        this.logger.log('🧪 DRY RUN MODE - No actual import will be performed');
      }

      // Check yt-dlp installation first
      await this.checkYtDlpInstallation();

      // 1. Get video metadata and available subtitles
      const { stdout } = await execAsync(`yt-dlp -J "${options.youtubeUrl}"`);
      const metadata = JSON.parse(stdout) as YouTubeMetadata;
      const videoTitle = options.title || metadata.title || 'Untitled Video';
      const availableSubtitles = [
        ...Object.keys(metadata.subtitles || {}),
        ...Object.keys(metadata.automatic_captions || {}),
      ];

      this.logger.log(`Video title: ${videoTitle}`);
      this.logger.log(
        `Available subtitle languages: ${availableSubtitles.join(', ')}`,
      );

      let videoPath: string | null = null;

      if (!options.dryRun) {
        // 2. Download video (only in non-dry-run mode)
        this.logger.log('Downloading video...');
        videoPath = await this.downloadVideo(options.youtubeUrl, tempDir);
      } else {
        // In dry-run mode, skip video download
        this.logger.log('⏭️  Skipping video download (dry-run mode)');
      }

      // 3. Download subtitles (always do this for debugging)
      this.logger.log('🔍 Downloading and analyzing subtitles...');
      const subtitleData = await this.downloadAllSubtitlesWithDebug(
        options.youtubeUrl,
        tempDir,
        metadata,
        options.preferredLanguage || 'zh',
      );

      if (!subtitleData.primarySubtitle) {
        throw new Error('No Chinese subtitles found for this video');
      }

      // 4. Parse subtitles for preview
      const subtitleContent = fs.readFileSync(
        subtitleData.primarySubtitle.path,
        'utf-8',
      );
      const srtEntries = this.srtParser.parseSRT(subtitleContent);

      this.logger.log(`📝 Parsed ${srtEntries.length} subtitle entries`);
      this.logger.log(
        `📄 Primary subtitle preview (first 200 chars): ${subtitleContent.substring(0, 200)}...`,
      );

      if (options.dryRun) {
        // Return dry-run preview data with all subtitle tracks
        this.logger.log('🧪 DRY RUN COMPLETE - Preview data generated');
        return {
          episode: null,
          sentencesImported: 0,
          videoUrl: '',
          success: true,
          message: `Dry run completed for ${videoTitle}`,
          previewData: {
            videoTitle,
            availableSubtitles,
            subtitlePreviews: subtitleData.allSubtitles,
            parsedEntries: srtEntries.length,
          },
        };
      }

      // Continue with actual import (non-dry-run mode)
      if (!videoPath) {
        throw new Error(
          'Video path is null - this should not happen in non-dry-run mode',
        );
      }

      // 5. Upload video to S3
      this.logger.log('Uploading video to S3...');
      const videoBuffer = fs.readFileSync(videoPath);
      const videoFileName = `episode-${Date.now()}.mp4`;
      const videoUrl = await this.movieAiService.uploadToS3(
        videoBuffer,
        videoFileName,
      );

      // 6. Create episode record
      this.logger.log('Creating episode record...');
      const episode = await this.episodeService.create({
        title: videoTitle,
        assetUrl: videoUrl,
        season_id: options.seasonId,
        knownCache: 0,
      });

      // 7. Parse and import subtitles directly to episode - check if multi-format
      this.logger.log('Parsing and importing subtitles...');

      let createdSentences: Sentence[] = [];
      const isMultiFormat = this.detectMultiFormatContent(subtitleContent);

      if (isMultiFormat) {
        this.logger.log(
          '🎯 Using MULTI-FORMAT parsing - extracting Simplified Chinese, Pinyin, and English',
        );
        const multiFormatEntries =
          this.srtParser.parseMultiFormatSRT(subtitleContent);
        createdSentences =
          await this.sentenceService.createSentencesFromMultiFormatSRT(
            multiFormatEntries,
            episode.id,
          );
        this.logger.log(
          `📚 Multi-format import: ${createdSentences.length} sentences with Chinese + Pinyin + English`,
        );
      } else {
        this.logger.log('📝 Using standard SRT parsing');
        createdSentences = await this.sentenceService.createSentencesFromSRT(
          srtEntries,
          episode.id,
        );
        this.logger.log(
          `📝 Standard import: ${createdSentences.length} sentences`,
        );
      }

      this.logger.log(
        `Successfully imported ${createdSentences.length} sentences`,
      );

      if (options.userId) {
        await this.episodeService.analyzeEpisode(episode.id, options.userId);
      }

      return {
        episode,
        sentencesImported: createdSentences.length,
        videoUrl,
        success: true,
        message: `Successfully imported ${videoTitle} with ${createdSentences.length} sentences${isMultiFormat ? ' (Multi-format: Chinese + Pinyin + English)' : ''}`,
      };
    } catch (error) {
      this.logger.error(`YouTube import failed: ${error.message}`);
      return {
        episode: null,
        sentencesImported: 0,
        videoUrl: '',
        success: false,
        message: `Import failed: ${error.message}`,
      };
    } finally {
      // Clean up temporary files
      this.cleanupTempDir(tempDir);
    }
  }

  private async getVideoMetadata(url: string): Promise<any> {
    try {
      const { stdout } = await execAsync(`yt-dlp -J "${url}"`);
      return JSON.parse(stdout);
    } catch (error) {
      this.logger.warn(`Could not get video metadata: ${error.message}`);
      return { title: 'Unknown Title' };
    }
  }

  private async downloadVideo(url: string, outputDir: string): Promise<string> {
    const outputPath = path.join(outputDir, 'video.%(ext)s');

    try {
      this.logger.log(`Executing yt-dlp with output path: ${outputPath}`);
      const command = `yt-dlp "${url}" -f "best[height<=720]/best" -o "${outputPath}" --no-playlist --no-warnings`;
      this.logger.log(`Full command: ${command}`);

      const { stdout, stderr } = await execAsync(command);

      this.logger.log('yt-dlp execution completed');
      this.logger.log(`yt-dlp stdout: ${stdout}`);
      if (stderr) {
        this.logger.log(`yt-dlp stderr: ${stderr}`);
      }
    } catch (error) {
      this.logger.error(`yt-dlp execution failed: ${error.message}`);
      // Try a simpler format selection as fallback
      try {
        this.logger.log('Retrying with simpler format selection...');
        const fallbackCommand = `yt-dlp "${url}" -f "mp4/best" -o "${outputPath}" --no-playlist`;
        const { stdout: fallbackStdout } = await execAsync(fallbackCommand);
        this.logger.log(`Fallback yt-dlp output: ${fallbackStdout}`);
      } catch (fallbackError) {
        this.logger.error(
          `Fallback yt-dlp execution also failed: ${fallbackError.message}`,
        );
        throw new Error(`Video download failed: ${error.message}`);
      }
    }

    // Wait a moment for file system to sync
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Find the downloaded video file
    const files = fs.readdirSync(outputDir);
    this.logger.log(`Files in temp directory: ${files.join(', ')}`);

    const videoFile = files.find(
      (file) =>
        file.startsWith('video.') &&
        (file.endsWith('.mp4') ||
          file.endsWith('.webm') ||
          file.endsWith('.mkv') ||
          file.endsWith('.m4a') ||
          file.endsWith('.flv')),
    );

    if (!videoFile) {
      this.logger.error(
        `No video file found. Available files: ${files.join(', ')}`,
      );
      throw new Error('Video download failed - no video file found');
    }

    this.logger.log(`Found video file: ${videoFile}`);
    return path.join(outputDir, videoFile);
  }

  private async downloadSubtitles(
    url: string,
    outputDir: string,
    language: string = 'zh',
  ): Promise<string | null> {
    const outputPath = path.join(outputDir, 'subtitles.%(ext)s');

    try {
      // Try to download subtitles in specified language
      const command = `yt-dlp "${url}" --write-subs --write-auto-subs --sub-langs "${language}.*,zh-CN,zh-TW,zh-HK,zh" --skip-download --sub-format srt -o "${outputPath}" --no-playlist`;
      await execAsync(command);

      // Find subtitle file
      const files = fs.readdirSync(outputDir);
      const subtitleFile = files.find(
        (file) => file.includes('subtitles') && file.endsWith('.srt'),
      );

      if (subtitleFile) {
        return path.join(outputDir, subtitleFile);
      }

      // If no subtitles found, try any available subtitles
      this.logger.warn(
        `No ${language} subtitles found, trying any available subtitles...`,
      );

      const fallbackCommand = `yt-dlp "${url}" --write-subs --write-auto-subs --skip-download --sub-format srt -o "${outputPath}" --no-playlist`;
      await execAsync(fallbackCommand);

      const allFiles = fs.readdirSync(outputDir);
      const anySubtitleFile = allFiles.find((file) => file.endsWith('.srt'));

      return anySubtitleFile ? path.join(outputDir, anySubtitleFile) : null;
    } catch (error) {
      this.logger.warn(`Subtitle download failed: ${error.message}`);
      return null;
    }
  }

  private async downloadSubtitlesWithDebug(
    url: string,
    outputDir: string,
    language: string = 'zh',
  ): Promise<{ path: string | null; content: string | null }> {
    const outputPath = path.join(outputDir, 'subtitles.%(ext)s');
    let subtitleContent: string | null = null;

    try {
      // Try to download subtitles in specified language
      const command = `yt-dlp "${url}" --write-subs --write-auto-subs --sub-langs "${language}.*,zh-CN,zh-TW,zh-HK,zh" --skip-download --sub-format srt -o "${outputPath}" --no-playlist`;
      await execAsync(command);

      // Find subtitle file
      const files = fs.readdirSync(outputDir);
      const subtitleFile = files.find(
        (file) => file.includes('subtitles') && file.endsWith('.srt'),
      );

      if (subtitleFile) {
        subtitleContent = fs.readFileSync(
          path.join(outputDir, subtitleFile),
          'utf-8',
        );
        this.logger.log(`Found ${language} subtitle file: ${subtitleFile}`);
        return {
          path: path.join(outputDir, subtitleFile),
          content: subtitleContent,
        };
      }

      // If no subtitles found, try any available subtitles
      this.logger.warn(
        `No ${language} subtitles found, trying any available subtitles...`,
      );

      const fallbackCommand = `yt-dlp "${url}" --write-subs --write-auto-subs --skip-download --sub-format srt -o "${outputPath}" --no-playlist`;
      await execAsync(fallbackCommand);

      const allFiles = fs.readdirSync(outputDir);
      const anySubtitleFile = allFiles.find((file) => file.endsWith('.srt'));

      if (anySubtitleFile) {
        subtitleContent = fs.readFileSync(
          path.join(outputDir, anySubtitleFile),
          'utf-8',
        );
        this.logger.warn(
          `Found any available subtitle file: ${anySubtitleFile}`,
        );
        return {
          path: path.join(outputDir, anySubtitleFile),
          content: subtitleContent,
        };
      }

      this.logger.warn(`No subtitle file found after all attempts.`);
      return { path: null, content: null };
    } catch (error) {
      this.logger.warn(`Subtitle download failed: ${error.message}`);
      return { path: null, content: null };
    }
  }

  private async downloadAllSubtitlesWithDebug(
    url: string,
    outputDir: string,
    metadata: YouTubeMetadata,
    language: string = 'zh',
  ): Promise<{
    primarySubtitle: { path: string; content: string } | null;
    allSubtitles: Array<{
      language: string;
      filename: string;
      preview: string;
      entryCount: number;
      isMultiFormat?: boolean;
      contentAnalysis?: string;
    }>;
  }> {
    const allSubtitles: Array<{
      language: string;
      filename: string;
      preview: string;
      entryCount: number;
      isMultiFormat?: boolean;
      contentAnalysis?: string;
    }> = [];
    let primarySubtitle: { path: string; content: string } | null = null;

    // Priority queue - zh-CN is now TOP priority since it typically contains multi-format content!
    const priorityLanguages = [
      'zh-CN', // HIGHEST PRIORITY - Often contains multi-format (traditional + simplified + pinyin + English)
      'zh', // Generic Chinese - may contain multi-format
      'zh-Hans', // Simplified Chinese only
      'zh-Hant', // Traditional Chinese only
      'zh-TW', // Taiwan Chinese
      'zh-HK', // Hong Kong Chinese
      'en', // English (for comparison)
    ];

    try {
      this.logger.log('🔍 Analyzing available subtitles...');

      const subtitles = metadata.subtitles || {};
      const autoSubtitles = metadata.automatic_captions || {};

      this.logger.log('Available subtitle tracks:');
      for (const [lang, formats] of Object.entries(subtitles)) {
        this.logger.log(
          `- ${lang} (manual): ${formats.map((f) => f.ext).join(', ')}`,
        );
      }
      for (const [lang, formats] of Object.entries(autoSubtitles)) {
        this.logger.log(
          `- ${lang} (auto): ${formats.map((f) => f.ext).join(', ')}`,
        );
      }

      // Try to find and download subtitles in priority order
      for (const lang of priorityLanguages) {
        const manualFormats = subtitles[lang] || [];
        const autoFormats = autoSubtitles[lang] || [];

        if (manualFormats.length === 0 && autoFormats.length === 0) {
          this.logger.log(`⚠️ No ${lang} subtitles found`);
          continue;
        }

        this.logger.log(`📥 Downloading ${lang} subtitles...`);

        // Prefer manual subtitles over auto-generated
        const formats = manualFormats.length > 0 ? manualFormats : autoFormats;

        // Download this language's subtitles
        const command = `yt-dlp "${url}" --write-subs --write-auto-subs --sub-langs "${lang}" --skip-download --sub-format srt -o "${outputDir}/subtitles.%(ext)s" --no-playlist`;
        await execAsync(command);

        // Check downloaded files
        const files = fs.readdirSync(outputDir);
        const subtitleFiles = files.filter(
          (file) =>
            file.includes('subtitles') &&
            file.includes(lang) &&
            file.endsWith('.srt'),
        );

        if (subtitleFiles.length > 0) {
          this.logger.log(
            `✅ Downloaded ${subtitleFiles.length} ${lang} subtitle files: ${subtitleFiles.join(', ')}`,
          );

          // Analyze each subtitle file
          for (const subtitleFile of subtitleFiles) {
            const filePath = path.join(outputDir, subtitleFile);
            const content = fs.readFileSync(filePath, 'utf-8');
            const entries = this.srtParser.parseSRT(content);

            // Detect content type
            const isMultiFormat = this.detectMultiFormatContent(content);
            const contentAnalysis = this.analyzeSubtitleContent(content);

            allSubtitles.push({
              language: lang,
              filename: subtitleFile,
              preview: content.substring(0, 500) + '...',
              entryCount: entries.length,
              isMultiFormat,
              contentAnalysis,
            });

            this.logger.log(`📝 ${subtitleFile}: ${entries.length} entries`);
            this.logger.log(
              `   📊 Content type: ${isMultiFormat ? 'MULTI-FORMAT (Traditional + Simplified + Pinyin + English)' : contentAnalysis}`,
            );
            this.logger.log(
              `   🔍 Preview: ${content.substring(0, 120).replace(/\n/g, ' | ')}...`,
            );

            // If this is a multi-format Chinese track, we've found our primary
            if (
              (lang === 'zh-CN' || lang === 'zh') &&
              isMultiFormat &&
              !primarySubtitle
            ) {
              primarySubtitle = { path: filePath, content };
              this.logger.log(
                `🎯 Selected PRIMARY (MULTI-FORMAT ${lang}): ${subtitleFile}`,
              );
              break; // Stop processing more files for this language
            }
          }

          // If we found a primary subtitle, we can stop looking
          if (primarySubtitle) {
            break;
          }
        }

        // Small delay to be respectful to YouTube
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // If no multi-format found, look for next best options
      if (!primarySubtitle) {
        for (const subtitle of allSubtitles) {
          const filePath = path.join(outputDir, subtitle.filename);
          const content = fs.readFileSync(filePath, 'utf-8');

          // Priority 2: Generic "zh" track
          if (subtitle.language === 'zh') {
            primarySubtitle = { path: filePath, content };
            this.logger.log(`🎯 Selected PRIMARY (zh): ${subtitle.filename}`);
            break;
          }
        }
      }

      // If still no primary, look for simplified Chinese
      if (!primarySubtitle) {
        for (const subtitle of allSubtitles) {
          const filePath = path.join(outputDir, subtitle.filename);
          const content = fs.readFileSync(filePath, 'utf-8');

          // Priority 3: Simplified Chinese
          if (subtitle.language.includes('zh-Hans')) {
            primarySubtitle = { path: filePath, content };
            this.logger.log(
              `🎯 Selected PRIMARY (zh-Hans): ${subtitle.filename}`,
            );
            break;
          }
        }
      }

      // If still no primary, look for any Chinese track
      if (!primarySubtitle) {
        for (const subtitle of allSubtitles) {
          const filePath = path.join(outputDir, subtitle.filename);
          const content = fs.readFileSync(filePath, 'utf-8');

          if (subtitle.language.includes('zh')) {
            primarySubtitle = { path: filePath, content };
            this.logger.log(
              `🎯 Selected PRIMARY (${subtitle.language}): ${subtitle.filename}`,
            );
            break;
          }
        }
      }

      // Final fallback: use first available subtitle if no Chinese found
      if (!primarySubtitle && allSubtitles.length > 0) {
        const firstSubtitle = allSubtitles[0];
        const filePath = path.join(outputDir, firstSubtitle.filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        primarySubtitle = { path: filePath, content };
        this.logger.warn(
          `⚠️ No Chinese subtitle found, using first available: ${firstSubtitle.filename}`,
        );
      }

      this.logger.log(
        `📊 Analysis complete: ${allSubtitles.length} tracks analyzed`,
      );
      if (primarySubtitle) {
        this.logger.log(
          `🏆 Primary subtitle selected from: ${primarySubtitle.path}`,
        );
      }

      return { primarySubtitle, allSubtitles };
    } catch (error) {
      this.logger.warn(`Subtitle download failed: ${error.message}`);
      return { primarySubtitle: null, allSubtitles: [] };
    }
  }

  /**
   * Detect if subtitle content contains multiple formats
   * Intelligently identifies if entries contain Traditional Chinese, Simplified Chinese, Pinyin, and English
   */
  private detectMultiFormatContent(content: string): boolean {
    const lines = content.split('\n');
    let currentEntry: {
      index?: number;
      timestamp?: string;
      textLines: string[];
    } = { textLines: [] };
    const entries: Array<{ textLines: string[] }> = [];

    // Parse SRT structure to group text lines by subtitle entry
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        // Empty line indicates end of entry
        if (currentEntry.textLines.length > 0) {
          entries.push({ textLines: [...currentEntry.textLines] });
          currentEntry = { textLines: [] };
        }
        continue;
      }

      if (/^\d+$/.test(line)) {
        // Entry index - start new entry
        currentEntry = { textLines: [] };
      } else if (line.includes('-->')) {
        // Timestamp line - skip
        continue;
      } else {
        // Text content - add to current entry
        currentEntry.textLines.push(line);
      }
    }

    // Add the last entry if it exists
    if (currentEntry.textLines.length > 0) {
      entries.push({ textLines: [...currentEntry.textLines] });
    }

    // Now check each entry for multi-format patterns
    let multiFormatCount = 0;
    const totalEntries = Math.min(entries.length, 5); // Check first 5 entries

    for (let i = 0; i < totalEntries; i++) {
      const entry = entries[i];
      const textLines = entry.textLines;

      if (textLines.length >= 3) {
        // Analyze all lines to identify content types
        let hasSimplified = false;
        let hasPinyin = false;
        let hasEnglish = false;

        for (const line of textLines) {
          // Check for Simplified Chinese - use broader patterns but exclude traditional
          if (/[\u4e00-\u9fff]/.test(line)) {
            // Has Chinese characters - now check if it's simplified
            // Strong simplified indicators (characters that are distinctly simplified)
            const strongSimplified =
              /[个们来时间问题现实说话这那些什么发展国学习]/.test(line);
            // Traditional exclusion patterns (characters only found in traditional)
            const hasTraditional =
              /[個們來時間問題現實說話這那些什麼發展國學習]/.test(line);

            if (strongSimplified && !hasTraditional) {
              hasSimplified = true;
            } else if (!hasTraditional) {
              // If no traditional markers found, assume simplified for common characters
              hasSimplified = true;
            }
          }

          // Check for Pinyin (tone marks or romanized Chinese)
          if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(line)) {
            hasPinyin = true;
          } else if (/^[a-zA-Z\s!.,?]+$/.test(line) && /[a-z]/.test(line)) {
            // Check if it's likely English vs Pinyin by looking for common English words
            const commonEnglishWords =
              /\b(the|and|or|is|are|a|an|to|of|in|for|with|at|by|from|that|this|it|you|I|we|they|he|she|will|can|have|has|do|does|was|were|get|go|come|make|take|see|know|think|say|tell|give|find|feel|become|leave|put|use|work|call|try|ask|need|help|move|right|good|bad|big|small|high|low|old|new|first|last|long|great|little|own|other|different|important|large|young|early|late|next|few|public|same)\b/i;
            if (!commonEnglishWords.test(line)) {
              // Looks like romanized Chinese (not pure English)
              hasPinyin = true;
            }
          }

          // Check for English (common English words and patterns)
          const commonEnglishWords =
            /\b(the|and|or|is|are|a|an|to|of|in|for|with|at|by|from|that|this|it|you|I|we|they|he|she|will|can|have|has|do|does|was|were|get|go|come|make|take|see|know|think|say|tell|give|find|feel|become|leave|put|use|work|call|try|ask|need|help|move|right|good|bad|big|small|high|low|old|new|first|last|long|great|little|own|other|different|important|large|young|early|late|next|few|public|same)\b/i;
          if (commonEnglishWords.test(line)) {
            hasEnglish = true;
          }
        }

        // Count as multi-format if we have all 3 types: simplified + pinyin + English
        if (hasSimplified && hasPinyin && hasEnglish) {
          multiFormatCount++;
        }
      }
    }

    // Consider it multi-format if at least 60% of checked entries match the pattern
    const threshold = Math.ceil(totalEntries * 0.6);
    const isMultiFormat = multiFormatCount >= threshold;

    // Debug logging
    this.logger.log(
      `🔍 Multi-format detection: ${multiFormatCount}/${totalEntries} entries match (threshold: ${threshold}) - Result: ${isMultiFormat ? 'MULTI-FORMAT' : 'Single format'}`,
    );

    return isMultiFormat;
  }

  /**
   * Analyze subtitle content to determine type
   */
  private analyzeSubtitleContent(content: string): string {
    const hasTraditional =
      /[備們個來時間問題現實際際應該專業業務務項發現實]/.test(content);
    const hasSimplified =
      /[备们个来时间问题现实际际应该专业业务务项发现实]/.test(content);
    const hasPinyin = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(content);
    const hasEnglish = /\b[a-zA-Z]{3,}\b/.test(content);

    const types: string[] = [];
    if (hasTraditional) types.push('Traditional Chinese');
    if (hasSimplified) types.push('Simplified Chinese');
    if (hasPinyin) types.push('Pinyin');
    if (hasEnglish) types.push('English');

    return types.length > 0 ? types.join(' + ') : 'Unknown';
  }

  private cleanupTempDir(tempDir: string): void {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      this.logger.log(`Cleaned up temporary directory: ${tempDir}`);
    } catch (error) {
      this.logger.warn(`Failed to cleanup temp directory: ${error.message}`);
    }
  }

  /**
   * Get available subtitle languages for a YouTube video
   */
  async getAvailableSubtitles(url: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`yt-dlp -J "${url}"`);
      const metadata = JSON.parse(stdout) as YouTubeMetadata;
      const subtitles = metadata.subtitles || {};
      const autoSubtitles = metadata.automatic_captions || {};

      return [...Object.keys(subtitles), ...Object.keys(autoSubtitles)];
    } catch (error) {
      this.logger.error(`Failed to get subtitle info: ${error.message}`);
      return [];
    }
  }
}
