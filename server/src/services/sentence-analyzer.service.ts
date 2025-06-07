import { Injectable } from '@nestjs/common';
import { CharacterService } from './character.service';
import { CharacterDTO } from '../shared/interfaces/data.interface';

interface AnalyzedCharacter {
  char: string;
  known: boolean;
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

@Injectable()
export class SentenceAnalyzerService {
  constructor(private readonly characterService: CharacterService) {}

  async analyzeSentence(text: string): Promise<SentenceAnalysis> {
    // Remove spaces, punctuation, and non-Chinese characters
    const chars = text
      .replace(/[\s\p{P}\p{S}]/gu, '') // Remove spaces, punctuation, and symbols
      .replace(/[^\u4e00-\u9fff]/g, '') // Keep only Chinese characters
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

    // Create a map of known characters (those that have been reviewed)
    const knownCharacters = new Set(
      characterData
        .filter((char) => char && char.lastReviewDate !== null)
        .map((char) => char!.character),
    );

    // Analyze each unique character
    const allCharacters = await Promise.all(
      uniqueChars.map(async (char, index) => {
        const charData = characterData[index];
        const isKnown = knownCharacters.has(char);
        return {
          char,
          known: isKnown,
          charData: charData
            ? await this.characterService.makeCharacterDTO(charData)
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
}
