#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SRTParserService } from './services/srt-parser.service';
import { SentenceService } from './services/sentence.service';
import { SceneService } from './services/scene.service';
import * as fs from 'fs';
import * as path from 'path';

async function importSRT() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: npm run scene-import <path-to-srt-file>');
    console.error('Example: npm run scene-import ~/Downloads/33.srt');
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
    const sceneService = app.get(SceneService);

    // Extract filename and scene ID
    const filename = path.basename(filePath);
    const sceneId = srtParser.extractSceneIdFromFilename(filename);

    if (!sceneId) {
      console.error(
        `❌ Invalid filename format. Expected: {sceneId}.srt (e.g., 33.srt)`,
      );
      console.error(`Got: ${filename}`);
      process.exit(1);
    }

    console.log(`📂 Processing file: ${filename}`);
    console.log(`🎬 Target scene ID: ${sceneId}`);

    // Check if scene exists
    const scene = await sceneService.findOne(sceneId);
    if (!scene) {
      console.error(`❌ Scene with ID ${sceneId} does not exist in database`);
      process.exit(1);
    }

    console.log(`✅ Scene found: "${scene.title}"`);

    // Check for existing sentences
    const existingCount = await sentenceService.countSentencesForScene(sceneId);
    if (existingCount > 0) {
      console.log(
        `⚠️  Scene ${sceneId} already has ${existingCount} sentences`,
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
      await sentenceService.deleteSentencesForScene(sceneId);
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
      sceneId,
    );

    console.log(
      `✅ Successfully imported ${createdSentences.length} sentences for scene ${sceneId}`,
    );
    console.log(`🎯 Scene: "${scene.title}"`);
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
