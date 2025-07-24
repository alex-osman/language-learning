import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../entities/episode.entity';
import { Scene } from '../entities/scene.entity';
import { Season } from '../entities/season.entity';
import { Media } from '../entities/media.entity';
import { SRTParserService } from './srt-parser.service';
import { SentenceService } from './sentence.service';
import { EpisodeService } from './episode.service';
import { SceneService } from './scene.service';
import { MovieAiService } from '../ai/services/movie.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface YouTubeImportOptions {
  youtubeUrl: string;
  seasonId: number;
  title?: string;
  preferredLanguage?: string; // Default: 'zh' for Chinese
  dryRun?: boolean; // If true, preview only without importing
}

export interface YouTubeImportResult {
  episode: Episode | null;
  scene: Scene | null;
  sentencesImported: number;
  videoUrl: string;
  success: boolean;
  message: string;
  // Dry run preview data
  previewData?: {
    videoTitle: string;
    availableSubtitles: string[];
    subtitlePreview: string;
    parsedEntries: number;
  };
}

@Injectable()
export class YouTubeImportService {
  private readonly logger = new Logger(YouTubeImportService.name);

  constructor(
    @InjectRepository(Episode)
    private episodeRepository: Repository<Episode>,
    @InjectRepository(Scene)
    private sceneRepository: Repository<Scene>,
    private srtParser: SRTParserService,
    private sentenceService: SentenceService,
    private episodeService: EpisodeService,
    private sceneService: SceneService,
    private movieAiService: MovieAiService,
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
      const metadata = await this.getVideoMetadata(options.youtubeUrl);
      const videoTitle = options.title || metadata.title || 'Untitled Video';
      const availableSubtitles = await this.getAvailableSubtitles(
        options.youtubeUrl,
      );

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
      const subtitleData = await this.downloadSubtitlesWithDebug(
        options.youtubeUrl,
        tempDir,
        options.preferredLanguage || 'zh',
      );

      if (!subtitleData.path) {
        throw new Error('No Chinese subtitles found for this video');
      }

      // 4. Parse subtitles for preview
      const subtitleContent = fs.readFileSync(subtitleData.path, 'utf-8');
      const srtEntries = this.srtParser.parseSRT(subtitleContent);

      this.logger.log(`📝 Parsed ${srtEntries.length} subtitle entries`);
      this.logger.log(
        `📄 Subtitle preview (first 200 chars): ${subtitleContent.substring(0, 200)}...`,
      );

      if (options.dryRun) {
        // Return dry-run preview data
        this.logger.log('🧪 DRY RUN COMPLETE - Preview data generated');
        return {
          episode: null,
          scene: null,
          sentencesImported: 0,
          videoUrl: '',
          success: true,
          message: `Dry run completed for ${videoTitle}`,
          previewData: {
            videoTitle,
            availableSubtitles,
            subtitlePreview: subtitleContent.substring(0, 500),
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

      // 7. Create scene record (one scene per episode for now)
      this.logger.log('Creating scene record...');
      const scene = await this.sceneService.create({
        title: `${videoTitle} - Scene 1`,
        number: 1,
        knownCache: 0,
        episodeId: episode.id,
      });

      // 8. Parse and import subtitles
      this.logger.log('Parsing and importing subtitles...');
      const createdSentences =
        await this.sentenceService.createSentencesFromSRT(srtEntries, scene.id);

      this.logger.log(
        `Successfully imported ${createdSentences.length} sentences`,
      );

      return {
        episode,
        scene,
        sentencesImported: createdSentences.length,
        videoUrl,
        success: true,
        message: `Successfully imported ${videoTitle} with ${createdSentences.length} sentences`,
      };
    } catch (error) {
      this.logger.error(`YouTube import failed: ${error.message}`);
      return {
        episode: null,
        scene: null,
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
      const metadata = JSON.parse(stdout);
      const subtitles = metadata.subtitles || {};
      const autoSubtitles = metadata.automatic_captions || {};

      return [...Object.keys(subtitles), ...Object.keys(autoSubtitles)];
    } catch (error) {
      this.logger.error(`Failed to get subtitle info: ${error.message}`);
      return [];
    }
  }
}
