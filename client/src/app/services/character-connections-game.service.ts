import { Injectable } from '@angular/core';
import { DataService, CharacterDTO } from './data.service';
import { firstValueFrom } from 'rxjs';

export interface ConnectionInfo {
  sharedRadicals: string[];  // e.g., ['女', '口']
  samePinyin: boolean;       // true if same sound
  pinyinSound: string | null; // e.g., "ma"
  points: number;            // Score for this connection
}

@Injectable({
  providedIn: 'root'
})
export class CharacterConnectionsGameService {
  private charactersMap = new Map<string, CharacterDTO>(); // Key: character text
  private allCharacters: CharacterDTO[] = [];
  private isLoaded = false;

  constructor(private dataService: DataService) {}

  /**
   * Load only the user's known characters from backend and store in Map for fast lookup
   */
  async loadCharacters(): Promise<void> {
    if (this.isLoaded) return;

    // Get only characters the user knows (extraChars=0 means no additional unknown chars)
    const chars = await firstValueFrom(this.dataService.getCharacters(0));
    this.allCharacters = chars;

    chars.forEach(char => {
      this.charactersMap.set(char.character, char);
    });

    this.isLoaded = true;
  }

  /**
   * Generate random start and end characters for the challenge
   * Ensures they are not directly connected (too easy)
   */
  generateChallenge(): { start: CharacterDTO, end: CharacterDTO } {
    if (this.allCharacters.length === 0) {
      throw new Error('Characters not loaded yet. Call loadCharacters() first.');
    }

    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const start = this.allCharacters[Math.floor(Math.random() * this.allCharacters.length)];
      const end = this.allCharacters[Math.floor(Math.random() * this.allCharacters.length)];

      // Make sure they're different
      if (start.character === end.character) {
        attempts++;
        continue;
      }

      // Check if they're directly connected (too easy)
      const connection = this.findConnection(start, end);
      const isDirectlyConnected = connection.sharedRadicals.length > 0 || connection.samePinyin;

      if (!isDirectlyConnected) {
        return { start, end };
      }

      attempts++;
    }

    // Fallback: just return any two different characters if we can't find a good pair
    const start = this.allCharacters[0];
    const end = this.allCharacters[Math.min(1, this.allCharacters.length - 1)];
    return { start, end };
  }

  /**
   * Look up a character by its text (e.g., "云")
   * Returns null if character not found in database
   */
  getCharacter(text: string): CharacterDTO | null {
    return this.charactersMap.get(text) || null;
  }

  /**
   * Find what two characters share (for display purposes only)
   * Does NOT validate if connection is "good" - just shows what they have in common
   * Also calculates points for this connection
   */
  findConnection(char1: CharacterDTO, char2: CharacterDTO): ConnectionInfo {
    const sharedRadicals = this.getSharedRadicals(char1, char2);
    const samePinyin = this.haveSamePinyin(char1, char2);

    // Calculate points (lower is better)
    let points = 20; // Default penalty for no connection
    if (sharedRadicals.length > 0) {
      points = 10; // Radical connection
    }
    if (samePinyin) {
      points = Math.min(points, 5); // Pinyin connection (better if they also share radical)
    }

    return {
      sharedRadicals,
      samePinyin,
      pinyinSound: samePinyin ? this.removeTones(char1.pinyin) : null,
      points
    };
  }

  /**
   * Get radicals that appear in both characters
   * Also checks if one character itself appears as a radical in the other
   * Also does one-level decomposition of complex radicals
   * e.g., 想 has 相 as radical, and 相 = 木 + 目, so 想 can connect via 木 or 目
   */
  private getSharedRadicals(char1: CharacterDTO, char2: CharacterDTO): string[] {
    const shared: string[] = [];

    if (!char1.radicals && !char2.radicals) return [];

    // Get radical lists (including one-level decomposition)
    const radicals1 = this.getRadicalsWithDecomposition(char1);
    const radicals2 = this.getRadicalsWithDecomposition(char2);

    // Check if radicals from char1 appear in char2's radicals
    const sharedFromRadicals = radicals1.filter(r => radicals2.includes(r));
    shared.push(...sharedFromRadicals);

    // Check if char1 itself appears as a radical in char2
    // e.g., 舌 appears in 话's radicals
    if (radicals2.includes(char1.character)) {
      shared.push(char1.character);
    }

    // Check if char2 itself appears as a radical in char1
    // e.g., if connecting 话 → 舌
    if (radicals1.includes(char2.character)) {
      shared.push(char2.character);
    }

    // Remove duplicates
    return [...new Set(shared)];
  }

  /**
   * Get all radicals for a character, including one-level decomposition of complex radicals
   * e.g., if character has 相 as radical, and 相 has [木, 目] as radicals,
   * return [相, 木, 目]
   */
  private getRadicalsWithDecomposition(char: CharacterDTO): string[] {
    const allRadicals: string[] = [];
    const baseRadicals = char.radicals?.map(r => r.radical) || [];

    // Add base radicals
    allRadicals.push(...baseRadicals);

    // For each radical, check if it's also a character we know
    // If so, add its sub-radicals (one level only)
    for (const radical of baseRadicals) {
      const radicalAsChar = this.charactersMap.get(radical);
      if (radicalAsChar && radicalAsChar.radicals) {
        const subRadicals = radicalAsChar.radicals.map(r => r.radical);
        allRadicals.push(...subRadicals);
      }
    }

    return [...new Set(allRadicals)]; // Remove duplicates
  }

  /**
   * Check if two characters have the same pinyin sound (ignoring tones)
   */
  private haveSamePinyin(char1: CharacterDTO, char2: CharacterDTO): boolean {
    if (!char1.pinyin || !char2.pinyin) return false;
    return this.removeTones(char1.pinyin) === this.removeTones(char2.pinyin);
  }

  /**
   * Remove tone marks from pinyin to get base sound
   * e.g., "mā" -> "ma", "yún" -> "yun"
   */
  private removeTones(pinyin: string): string {
    const toneMap: Record<string, string> = {
      'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
      'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
      'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
      'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
      'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
      'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü',
    };

    return pinyin
      .toLowerCase()
      .split('')
      .map(c => toneMap[c] || c)
      .join('');
  }
}
