#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { YouTubeImportService } from './services/youtube-import.service';

async function importFromYouTube() {
  const args = process.argv.slice(2);

  // Filter out --dry-run flag and process remaining args
  const isDryRun = args.includes('--dry-run');
  const filteredArgs = args.filter((arg) => arg !== '--dry-run');

  const youtubeUrl = filteredArgs[0];
  const seasonId = parseInt(filteredArgs[1]);
  const title = filteredArgs[2]; // Optional title override

  if (!youtubeUrl || !seasonId) {
    console.error(
      'Usage: npm run youtube-import <youtube-url> <season-id> [title] [--dry-run]',
    );
    console.error(
      'Example: npm run youtube-import "https://youtube.com/watch?v=abc123" 1',
    );
    console.error(
      'Example: npm run youtube-import "https://youtube.com/watch?v=abc123" 1 "Custom Title"',
    );
    console.error(
      'Example: npm run youtube-import "https://youtube.com/watch?v=abc123" 1 "Custom Title" --dry-run',
    );
    console.error('');
    console.error('Options:');
    console.error(
      '  --dry-run    Preview the import without actually importing (shows subtitle debugging)',
    );
    process.exit(1);
  }

  if (isNaN(seasonId)) {
    console.error('❌ Season ID must be a number');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting YouTube import...');
    console.log(`📺 URL: ${youtubeUrl}`);
    console.log(`📁 Season ID: ${seasonId}`);
    if (title) {
      console.log(`🏷️  Custom title: ${title}`);
    }
    if (isDryRun) {
      console.log('🧪 DRY RUN MODE - Preview only, no actual import');
    }

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get YouTube import service
    const youtubeImportService = app.get(YouTubeImportService);

    // Check available subtitles first
    console.log('🔍 Checking available subtitles...');
    const availableSubtitles =
      await youtubeImportService.getAvailableSubtitles(youtubeUrl);

    if (availableSubtitles.length > 0) {
      console.log(`📝 Found subtitles in: ${availableSubtitles.join(', ')}`);

      // Check if Chinese subtitles are available
      const hasChineseSubtitles = availableSubtitles.some(
        (lang) =>
          lang.includes('zh') ||
          lang.includes('chinese') ||
          lang.includes('中文'),
      );

      if (hasChineseSubtitles) {
        console.log('✅ Chinese subtitles detected!');
      } else {
        console.log(
          '⚠️  No Chinese subtitles detected. Will try auto-generated subtitles.',
        );
      }
    } else {
      console.log(
        '⚠️  No subtitle information available. Will attempt import anyway.',
      );
    }

    // Start the import process
    const result = await youtubeImportService.importFromYouTube({
      youtubeUrl,
      seasonId,
      title: title,
      preferredLanguage: 'zh',
      dryRun: isDryRun,
    });

    if (result.success) {
      if (isDryRun && result.previewData) {
        console.log('🧪 DRY RUN RESULTS:');
        console.log('================');
        console.log(`📺 Video Title: ${result.previewData.videoTitle}`);
        console.log(
          `🌍 Available Subtitle Languages: ${result.previewData.availableSubtitles.join(', ')}`,
        );
        console.log(`📝 Parsed Entries: ${result.previewData.parsedEntries}`);
        console.log('');
        console.log('📄 Subtitle Preview (first 500 characters):');
        console.log('─'.repeat(60));
        console.log(result.previewData.subtitlePreview);
        console.log('─'.repeat(60));
        console.log('');
        console.log(
          '✨ To perform actual import, run the same command without --dry-run',
        );
      } else {
        console.log('🎉 Import completed successfully!');
        console.log(`📊 Results:`);
        console.log(`   - Episode ID: ${result.episode?.id}`);
        console.log(`   - Episode Title: ${result.episode?.title}`);
        console.log(`   - Scene ID: ${result.scene?.id}`);
        console.log(`   - Sentences imported: ${result.sentencesImported}`);
        console.log(`   - Video URL: ${result.videoUrl}`);
        console.log(`✨ ${result.message}`);
      }
    } else {
      console.error('❌ Import failed!');
      console.error(`Error: ${result.message}`);
      process.exit(1);
    }

    await app.close();
  } catch (error) {
    console.error('❌ Import failed with error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the import
importFromYouTube().catch(console.error);
