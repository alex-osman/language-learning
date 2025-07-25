#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SRTParserService } from './services/srt-parser.service';
import { SentenceService } from './services/sentence.service';
import { EpisodeService } from './services/episode.service';
import * as fs from 'fs';
import * as path from 'path';

async function importSRT() {
  const episodeId = parseInt(process.argv[2]);
  const filePath = process.argv[3];

  if (!episodeId || !filePath) {
    console.error('Usage: npm run episode-import <episode-id> <path-to-srt-file>');
    console.error('Example: npm run episode-import 1 ~/Downloads/33.srt');
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  // Validate file extension
  if (!filePath.endsWith('.srt')) {
    console.error('File must have .srt extension');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting SRT import...');

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get services
    const srtParser = app.get(SRTParserService);
    const sentenceService = app.get(SentenceService);
    const episodeService = app.get(EpisodeService);

    // Use provided episode ID
    const filename = path.basename(filePath);
    console.log(`📂 Processing file: ${filename}`);
    console.log(`📺 Target episode ID: ${episodeId}`);

    // Check if episode exists
    const episode = await episodeService.findOne(episodeId);
    if (!episode) {
      console.error(`❌ Episode with ID ${episodeId} does not exist in database`);
      process.exit(1);
    }

    console.log(`✅ Episode found: "${episode.title}"`);

    // Check for existing sentences
    const existingCount = await sentenceService.countSentencesForEpisode(episodeId);
    if (existingCount > 0) {
      console.log(
        `⚠️  Episode ${episodeId} already has ${existingCount} sentences`,
      );
      console.log('❓ Do you want to replace them? (y/N)');

      // Simple prompt for confirmation
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        readline.question('', resolve);
      });

      readline.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Import cancelled');
        await app.close();
        process.exit(0);
      }

      console.log('🗑️  Deleting existing sentences...');
      await sentenceService.deleteSentencesForEpisode(episodeId);
    }

    // Read and parse SRT file
    console.log('📖 Reading SRT file...');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const srtEntries = srtParser.parseSRT(fileContent);

    if (srtEntries.length === 0) {
      console.error('❌ No valid subtitle entries found in SRT file');
      await app.close();
      process.exit(1);
    }

    console.log(`📝 Parsed ${srtEntries.length} subtitle entries`);

    // Import sentences
    console.log('💾 Importing sentences to database...');
    const createdSentences = await sentenceService.createSentencesFromSRT(
      srtEntries,
      episodeId,
    );

    console.log(
      `✅ Successfully imported ${createdSentences.length} sentences for episode ${episodeId}`,
    );
    console.log(`🎯 Episode: "${episode.title}"`);
    console.log(`📊 Stats:`);
    console.log(`   - Entries parsed: ${srtEntries.length}`);
    console.log(`   - Sentences created: ${createdSentences.length}`);

    // Show sample of imported sentences
    if (createdSentences.length > 0) {
      console.log(`📝 Sample sentences:`);
      createdSentences.slice(0, 3).forEach((sentence, index) => {
        const startTime = Math.floor(sentence.startMs / 1000);
        const endTime = Math.floor(sentence.endMs / 1000);
        console.log(
          `   ${index + 1}. [${startTime}s-${endTime}s] ${sentence.sentence}`,
        );
      });

      if (createdSentences.length > 3) {
        console.log(`   ... and ${createdSentences.length - 3} more`);
      }
    }

    await app.close();
    console.log('🎉 Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
importSRT().catch(console.error);
