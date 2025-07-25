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

        console.log('📄 SUBTITLE TRACKS FOUND (in priority order):');
        console.log('═'.repeat(80));

        if (result.previewData.subtitlePreviews.length === 0) {
          console.log('❌ No subtitle tracks were successfully downloaded');
        } else {
          // Sort by NEW priority (zh first, then zh-Hans, etc.)
          const priorityOrder = [
            'zh',
            'zh-Hans',
            'zh-Hant',
            'zh-CN',
            'zh-TW',
            'zh-HK',
            'en',
          ];
          const sortedTracks = result.previewData.subtitlePreviews.sort(
            (a, b) => {
              const aPriority = priorityOrder.findIndex((p) =>
                a.language.includes(p),
              );
              const bPriority = priorityOrder.findIndex((p) =>
                b.language.includes(p),
              );
              const aIndex = aPriority === -1 ? 999 : aPriority;
              const bIndex = bPriority === -1 ? 999 : bPriority;
              return aIndex - bIndex;
            },
          );

          // Check if we found the holy grail multi-format track
          const hasMultiFormat = sortedTracks.some(
            (track) => track.isMultiFormat,
          );

          if (hasMultiFormat) {
            console.log('🎉 HOLY GRAIL FOUND! Multi-format track detected!');
            console.log(
              '🏆 Perfect for language learning: Traditional + Simplified + Pinyin + English',
            );
            console.log('');
          }

          sortedTracks.forEach((subtitle, index) => {
            const isPrimary = index === 0 && subtitle.language.includes('zh');
            const priority =
              priorityOrder.findIndex((p) => subtitle.language.includes(p)) + 1;
            const isMulti = subtitle.isMultiFormat;

            console.log(
              `\n${index + 1}. ${isPrimary ? '🎯 PRIMARY' : '📋'} ${isMulti ? '🏆 MULTI-FORMAT' : ''} TRACK: ${subtitle.language} ${isPrimary ? '(SELECTED FOR IMPORT)' : ''}`,
            );

            if (isMulti) {
              console.log(
                `   🎉 JACKPOT! Contains: Traditional + Simplified + Pinyin + English`,
              );
            } else {
              console.log(
                `   📊 Content: ${subtitle.contentAnalysis || 'Unknown'}`,
              );
            }

            console.log(
              `   🏆 Priority: ${priority > 0 ? `#${priority}` : 'Lower'} ${priority === 1 ? '(NEW HIGHEST - Multi-format zh)' : priority === 2 ? '(Simplified Chinese)' : ''}`,
            );
            console.log(`   📁 File: ${subtitle.filename}`);
            console.log(`   📊 Entries: ${subtitle.entryCount}`);
            console.log(`   📄 Content Preview:`);
            console.log('   ' + '─'.repeat(70));

            // Show first few lines of actual subtitle content
            const lines = subtitle.preview
              .split('\n')
              .slice(0, isMulti ? 8 : 6);
            lines.forEach((line) => {
              if (line.trim()) {
                console.log('   ' + line);
              }
            });

            if (isMulti) {
              console.log(
                '   ↑ Traditional, ↑ Simplified, ↑ Pinyin, ↑ English',
              );
            }

            console.log('   ' + '─'.repeat(70));
          });
        }

        console.log('\n' + '═'.repeat(80));
        console.log('');
        console.log('💡 SUBTITLE ANALYSIS:');

        const hasMultiFormat = result.previewData.subtitlePreviews.some(
          (s) => s.isMultiFormat,
        );
        const hasSimplified = result.previewData.subtitlePreviews.some((s) =>
          s.language.includes('zh-Hans'),
        );
        const hasTraditional = result.previewData.subtitlePreviews.some((s) =>
          s.language.includes('zh-Hant'),
        );
        const hasEnglish = result.previewData.subtitlePreviews.some((s) =>
          s.language.includes('en'),
        );

        console.log(
          `  🏆 Multi-format track (zh): ${hasMultiFormat ? '✅ FOUND! (PERFECT)' : '❌ Not found'}`,
        );
        console.log(
          `  📝 Simplified Chinese (zh-Hans): ${hasSimplified ? '✅ Found' : '❌ Not found'}`,
        );
        console.log(
          `  📝 Traditional Chinese (zh-Hant): ${hasTraditional ? '✅ Found' : '❌ Not found'}`,
        );
        console.log(
          `  📝 English (en): ${hasEnglish ? '✅ Found' : '❌ Not found'}`,
        );

        if (hasMultiFormat) {
          console.log(
            `  🎯 RECOMMENDATION: Use multi-format "zh" track - contains ALL formats!`,
          );
          console.log(`     • Traditional Chinese for character recognition`);
          console.log(`     • Simplified Chinese for modern learning`);
          console.log(`     • Pinyin for pronunciation`);
          console.log(`     • English for meaning comprehension`);
        } else if (hasSimplified) {
          console.log(
            `  🎯 RECOMMENDED: Use zh-Hans track (simplified Chinese)`,
          );
        } else if (hasTraditional) {
          console.log(
            `  🎯 RECOMMENDED: Use zh-Hant track (traditional Chinese)`,
          );
        }

        console.log('');
        console.log('🔍 NEXT STEPS:');
        if (hasMultiFormat) {
          console.log(
            '  ✅ Perfect! Multi-format track found - ready for import',
          );
          console.log(
            '  • This will create sentences with Traditional, Simplified, Pinyin, and English',
          );
          console.log(
            '  • Optimal for comprehensive Chinese language learning',
          );
        } else {
          console.log('  • Review the content previews above');
          console.log('  • Look for pure Chinese characters vs mixed content');
          console.log('  • Consider if single-format tracks meet your needs');
        }
        console.log('');
        console.log(
          '✨ To perform actual import, run the same command without --dry-run',
        );
      } else {
        console.log('🎉 Import completed successfully!');
        console.log(`📊 Results:`);
        console.log(`   - Episode ID: ${result.episode?.id}`);
        console.log(`   - Episode Title: ${result.episode?.title}`);
        console.log(`   - Episode ID: ${result.episode?.id}`);
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
