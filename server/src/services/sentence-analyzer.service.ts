import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSentenceKnowledge } from 'src/entities/user-sentence-knowledge.entity';
import { Repository } from 'typeorm';
import { CharacterDTO } from '../shared/interfaces/data.interface';
import { CharacterService } from './character.service';
import { SentenceService } from './sentence.service';
import {
  CharacterKnowledgeStatus,
  UserCharacterKnowledgeService,
} from './user-character-knowledge.service';

interface AnalyzedCharacter {
  char: string;
  known: boolean;
  charData?: CharacterDTO;
  count: number;
}

// NEW: Enhanced interface for three-state analysis
interface AnalyzedCharacterEnhanced {
  char: string;
  status: CharacterKnowledgeStatus;
  charData?: CharacterDTO;
  count: number;
}

export interface SentenceAnalysis {
  known_characters: string[];
  unknown_characters: string[];
  known_count: number;
  unknown_count: number;
  total_characters: number;
  known_percent: number;
  all_characters: AnalyzedCharacter[];
}

// NEW: Enhanced analysis with three states
export interface EnhancedSentenceAnalysis {
  learned_characters: string[];
  seen_characters: string[];
  unknown_characters: string[];
  learning_characters: string[];
  learned_count: number;
  seen_count: number;
  unknown_count: number;
  learning_count: number;
  total_characters: number;
  learned_percent: number;
  seen_percent: number;
  unknown_percent: number;
  all_characters: AnalyzedCharacterEnhanced[];
}

const IGNORE_CHARACTERS = [];

@Injectable()
export class SentenceAnalyzerService {
  constructor(
    private readonly characterService: CharacterService,
    private readonly sentenceService: SentenceService,
    private readonly userCharacterKnowledgeService: UserCharacterKnowledgeService,
    @InjectRepository(UserSentenceKnowledge)
    private userSentenceKnowledgeRepository: Repository<UserSentenceKnowledge>,
  ) {}

  async analyzeSentenceId(sentenceId: number, userId: number) {
    const sentence = await this.sentenceService.getSentenceById(sentenceId);
    const analysis = await this.analyzeSentence(sentence.sentence, userId);

    await this.userSentenceKnowledgeRepository.delete({
      userID: userId,
      sentenceID: sentenceId,
    });

    await this.userSentenceKnowledgeRepository.insert({
      userID: userId,
      sentenceID: sentenceId,
      comprehensionPercentage: analysis.known_percent,
    });

    return analysis;
  }

  async analyzeSentence(
    text: string,
    userId?: number,
  ): Promise<SentenceAnalysis> {
    // Remove spaces, punctuation, and non-Chinese characters
    const chars = text
      .replace(/[\s\p{P}\p{S}]/gu, '') // Remove spaces, punctuation, and symbols
      .replace(/[^\u4e00-\u9fff]/g, '') // Keep only Chinese characters
      .replace(new RegExp(`[${IGNORE_CHARACTERS.join('')}]`, 'g'), '') // Remove ignored characters
      .split('');

    // Count occurrences of each character
    const charCounts = new Map<string, number>();
    chars.forEach((char) => {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    });

    // Get all unique characters
    const uniqueChars = Array.from(charCounts.keys());

    // Get character data for all unique characters
    const characterData = await Promise.all(
      uniqueChars.map((char) => this.characterService.findByCharacter(char)),
    );

    // Create a map of known characters based on user context
    let knownCharacters: Set<string>;
    if (userId) {
      // Use user-specific learning data
      const knownCharPromises = characterData
        .filter((char) => char)
        .map(async (char) => {
          const hasReviewed =
            await this.userCharacterKnowledgeService.hasUserReviewed(
              userId,
              char!.id,
            );
          return hasReviewed ? char!.character : null;
        });

      const knownCharResults = await Promise.all(knownCharPromises);
      knownCharacters = new Set(
        knownCharResults.filter((char) => char !== null),
      );
    } else {
      // Fallback to global character data (existing behavior)
      knownCharacters = new Set(
        characterData.filter((char) => char).map((char) => char!.character),
      );
    }

    // Analyze each unique character
    const allCharacters = await Promise.all(
      uniqueChars.map(async (char, index) => {
        const charData = characterData[index];
        const isKnown = knownCharacters.has(char);
        return {
          char,
          known: isKnown,
          charData: charData
            ? await this.characterService.makeCharacterDTO(charData, userId)
            : undefined,
          count: charCounts.get(char) || 0,
        };
      }),
    );

    // Calculate statistics
    const knownChars = allCharacters.filter((c) => c.known).map((c) => c.char);
    const unknownChars = allCharacters
      .filter((c) => !c.known)
      .map((c) => c.char);
    const totalChars = chars.length;
    const knownCount = knownChars.length;
    const unknownCount = unknownChars.length;
    const knownPercent =
      totalChars > 0 ? (knownCount / uniqueChars.length) * 100 : 0;

    return {
      known_characters: knownChars,
      unknown_characters: unknownChars,
      known_count: knownCount,
      unknown_count: unknownCount,
      total_characters: totalChars,
      known_percent: Math.round(knownPercent),
      all_characters: allCharacters,
    };
  }

  // NEW: Enhanced analysis with learned/seen/unknown categorization
  async analyzeTextWithKnowledgeStatus(
    text: string,
    userId: number,
  ): Promise<EnhancedSentenceAnalysis> {
    // Remove spaces, punctuation, and non-Chinese characters
    const chars = text
      .replace(/[\s\p{P}\p{S}]/gu, '') // Remove spaces, punctuation, and symbols
      .replace(/[^\u4e00-\u9fff]/g, '') // Keep only Chinese characters
      .replace(new RegExp(`[${IGNORE_CHARACTERS.join('')}]`, 'g'), '') // Remove ignored characters
      .split('');

    // Count occurrences of each character
    const charCounts = new Map<string, number>();
    chars.forEach((char) => {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    });

    // Get all unique characters
    const uniqueChars = Array.from(charCounts.keys());

    // Get character data for all unique characters
    const characterData = await Promise.all(
      uniqueChars.map((char) => this.characterService.findByCharacter(char)),
    );

    // Analyze each unique character with knowledge status
    const allCharacters = await Promise.all(
      uniqueChars.map(async (char, index) => {
        const charData = characterData[index];
        let status = CharacterKnowledgeStatus.UNKNOWN;

        if (charData) {
          status =
            await this.userCharacterKnowledgeService.getCharacterKnowledgeStatus(
              userId,
              charData.id,
            );
        }

        return {
          char,
          status,
          charData: charData
            ? await this.characterService.makeCharacterDTO(charData, userId)
            : undefined,
          count: charCounts.get(char) || 0,
        };
      }),
    );

    // Categorize characters by status
    const learnedChars = allCharacters
      .filter((c) => c.status === CharacterKnowledgeStatus.LEARNED)
      .map((c) => c.char);
    const seenChars = allCharacters
      .filter((c) => c.status === CharacterKnowledgeStatus.SEEN)
      .map((c) => c.char);
    const unknownChars = allCharacters
      .filter((c) => c.status === CharacterKnowledgeStatus.UNKNOWN)
      .map((c) => c.char);
    const learningChars = allCharacters
      .filter((c) => c.status === CharacterKnowledgeStatus.LEARNING)
      .map((c) => c.char);

    // Calculate statistics
    const totalUniqueChars = uniqueChars.length;
    const learnedCount = learnedChars.length;
    const seenCount = seenChars.length;
    const unknownCount = unknownChars.length;
    const learningCount = learningChars.length;

    const learnedPercent =
      totalUniqueChars > 0 ? (learnedCount / totalUniqueChars) * 100 : 0;
    const seenPercent =
      totalUniqueChars > 0 ? (seenCount / totalUniqueChars) * 100 : 0;
    const unknownPercent =
      totalUniqueChars > 0 ? (unknownCount / totalUniqueChars) * 100 : 0;

    return {
      learned_characters: learnedChars,
      seen_characters: seenChars,
      unknown_characters: unknownChars,
      learning_characters: learningChars,
      learned_count: learnedCount,
      seen_count: seenCount,
      unknown_count: unknownCount,
      learning_count: learningCount,
      total_characters: chars.length,
      learned_percent: Math.round(learnedPercent),
      seen_percent: Math.round(seenPercent),
      unknown_percent: Math.round(unknownPercent),
      all_characters: allCharacters,
    };
  }

  async analyzeSentences(
    texts: string[],
    userId?: number,
  ): Promise<SentenceAnalysis[]> {
    if (texts.length === 0) {
      return [];
    }

    // Process all texts to extract characters and build character count maps
    const textProcessingResults = texts.map((text) => {
      const chars = text
        .replace(/[\s\p{P}\p{S}]/gu, '') // Remove spaces, punctuation, and symbols
        .replace(/[^\u4e00-\u9fff]/g, '') // Keep only Chinese characters
        .replace(new RegExp(`[${IGNORE_CHARACTERS.join('')}]`, 'g'), '') // Remove ignored characters
        .split('');

      const charCounts = new Map<string, number>();
      chars.forEach((char) => {
        charCounts.set(char, (charCounts.get(char) || 0) + 1);
      });

      return { chars, charCounts, uniqueChars: Array.from(charCounts.keys()) };
    });

    // Get all unique characters across all texts
    const allUniqueChars = [
      ...new Set(textProcessingResults.flatMap((result) => result.uniqueChars)),
    ];

    // Batch fetch character data for all unique characters
    const characterDataMap = new Map<string, any>();
    const characterDataPromises = allUniqueChars.map(async (char) => {
      const charData = await this.characterService.findByCharacter(char);
      characterDataMap.set(char, charData);
      return { char, charData };
    });

    await Promise.all(characterDataPromises);

    // Batch fetch user knowledge status if userId provided
    let knownCharacters: Set<string>;
    if (userId) {
      const relevantCharData = Array.from(characterDataMap.values()).filter(
        (char) => char,
      );
      const knownCharPromises = relevantCharData.map(async (char) => {
        const hasReviewed =
          await this.userCharacterKnowledgeService.hasUserReviewed(
            userId,
            char.id,
          );
        return hasReviewed ? char.character : null;
      });

      const knownCharResults = await Promise.all(knownCharPromises);
      knownCharacters = new Set(
        knownCharResults.filter((char) => char !== null),
      );
    } else {
      knownCharacters = new Set(
        Array.from(characterDataMap.values())
          .filter((char) => char)
          .map((char) => char.character),
      );
    }

    // Process each text using the batched data
    const results = await Promise.all(
      textProcessingResults.map(
        async ({ chars, charCounts, uniqueChars }, textIndex) => {
          const allCharacters = await Promise.all(
            uniqueChars.map(async (char) => {
              const charData = characterDataMap.get(char);
              const isKnown = knownCharacters.has(char);
              return {
                char,
                known: isKnown,
                charData: charData
                  ? await this.characterService.makeCharacterDTO(
                      charData,
                      userId,
                    )
                  : undefined,
                count: charCounts.get(char) || 0,
              };
            }),
          );

          const knownChars = allCharacters
            .filter((c) => c.known)
            .map((c) => c.char);
          const unknownChars = allCharacters
            .filter((c) => !c.known)
            .map((c) => c.char);
          const totalChars = chars.length;
          const knownCount = knownChars.length;
          const unknownCount = unknownChars.length;
          const knownPercent =
            totalChars > 0 ? (knownCount / uniqueChars.length) * 100 : 0;

          return {
            known_characters: knownChars,
            unknown_characters: unknownChars,
            known_count: knownCount,
            unknown_count: unknownCount,
            total_characters: totalChars,
            known_percent: Math.round(knownPercent),
            all_characters: allCharacters,
          };
        },
      ),
    );

    return results;
  }

  async analyzeSentencesWithKnowledgeStatus(
    texts: string[],
    userId: number,
  ): Promise<EnhancedSentenceAnalysis[]> {
    if (texts.length === 0) {
      return [];
    }

    // Process all texts to extract characters and build character count maps
    const textProcessingResults = texts.map((text) => {
      const chars = text
        .replace(/[\s\p{P}\p{S}]/gu, '') // Remove spaces, punctuation, and symbols
        .replace(/[^\u4e00-\u9fff]/g, '') // Keep only Chinese characters
        .replace(new RegExp(`[${IGNORE_CHARACTERS.join('')}]`, 'g'), '') // Remove ignored characters
        .split('');

      const charCounts = new Map<string, number>();
      chars.forEach((char) => {
        charCounts.set(char, (charCounts.get(char) || 0) + 1);
      });

      return { chars, charCounts, uniqueChars: Array.from(charCounts.keys()) };
    });

    // Get all unique characters across all texts
    const allUniqueChars = [
      ...new Set(textProcessingResults.flatMap((result) => result.uniqueChars)),
    ];

    // Batch fetch character data for all unique characters
    const characterDataMap = new Map<string, any>();
    const characterDataPromises = allUniqueChars.map(async (char) => {
      const charData = await this.characterService.findByCharacter(char);
      characterDataMap.set(char, charData);
      return { char, charData };
    });

    await Promise.all(characterDataPromises);

    // Batch fetch knowledge status for all relevant characters
    const relevantCharData = Array.from(characterDataMap.values()).filter(
      (char) => char,
    );
    const knowledgeStatusPromises = relevantCharData.map(async (char) => {
      const status =
        await this.userCharacterKnowledgeService.getCharacterKnowledgeStatus(
          userId,
          char.id,
        );
      return { character: char.character, status };
    });

    const knowledgeStatusResults = await Promise.all(knowledgeStatusPromises);
    const knowledgeStatusMap = new Map(
      knowledgeStatusResults.map((result) => [result.character, result.status]),
    );

    // Process each text using the batched data
    const results = await Promise.all(
      textProcessingResults.map(async ({ chars, charCounts, uniqueChars }) => {
        const allCharacters = await Promise.all(
          uniqueChars.map(async (char) => {
            const charData = characterDataMap.get(char);
            let status = CharacterKnowledgeStatus.UNKNOWN;

            if (charData && knowledgeStatusMap.has(char)) {
              status =
                knowledgeStatusMap.get(char) ||
                CharacterKnowledgeStatus.UNKNOWN;
            }

            return {
              char,
              status,
              charData: charData
                ? await this.characterService.makeCharacterDTO(charData, userId)
                : undefined,
              count: charCounts.get(char) || 0,
            };
          }),
        );

        // Categorize characters by status
        const learnedChars = allCharacters
          .filter((c) => c.status === CharacterKnowledgeStatus.LEARNED)
          .map((c) => c.char);
        const seenChars = allCharacters
          .filter((c) => c.status === CharacterKnowledgeStatus.SEEN)
          .map((c) => c.char);
        const unknownChars = allCharacters
          .filter((c) => c.status === CharacterKnowledgeStatus.UNKNOWN)
          .map((c) => c.char);
        const learningChars = allCharacters
          .filter((c) => c.status === CharacterKnowledgeStatus.LEARNING)
          .map((c) => c.char);

        // Calculate statistics
        const totalUniqueChars = uniqueChars.length;
        const learnedCount = learnedChars.length;
        const seenCount = seenChars.length;
        const unknownCount = unknownChars.length;
        const learningCount = learningChars.length;

        const learnedPercent =
          totalUniqueChars > 0 ? (learnedCount / totalUniqueChars) * 100 : 0;
        const seenPercent =
          totalUniqueChars > 0 ? (seenCount / totalUniqueChars) * 100 : 0;
        const unknownPercent =
          totalUniqueChars > 0 ? (unknownCount / totalUniqueChars) * 100 : 0;

        return {
          learned_characters: learnedChars,
          seen_characters: seenChars,
          unknown_characters: unknownChars,
          learning_characters: learningChars,
          learned_count: learnedCount,
          seen_count: seenCount,
          unknown_count: unknownCount,
          learning_count: learningCount,
          total_characters: chars.length,
          learned_percent: Math.round(learnedPercent),
          seen_percent: Math.round(seenPercent),
          unknown_percent: Math.round(unknownPercent),
          all_characters: allCharacters,
        };
      }),
    );

    return results;
  }
}
