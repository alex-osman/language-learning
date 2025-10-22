import { Injectable } from '@angular/core';
import { DataService, CharacterDTO } from './data.service';
import { firstValueFrom } from 'rxjs';

export interface ConnectionInfo {
  sharedRadicals: string[];  // e.g., ['女', '口']
  samePinyin: boolean;       // true if same sound
  pinyinSound: string | null; // e.g., "ma"
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
   */
  generateChallenge(): { start: CharacterDTO, end: CharacterDTO } {
    if (this.allCharacters.length === 0) {
      throw new Error('Characters not loaded yet. Call loadCharacters() first.');
    }

    const start = this.allCharacters[Math.floor(Math.random() * this.allCharacters.length)];
    let end = this.allCharacters[Math.floor(Math.random() * this.allCharacters.length)];

    // Make sure start and end are different
    while (end.character === start.character) {
      end = this.allCharacters[Math.floor(Math.random() * this.allCharacters.length)];
    }

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
   */
  findConnection(char1: CharacterDTO, char2: CharacterDTO): ConnectionInfo {
    const sharedRadicals = this.getSharedRadicals(char1, char2);
    const samePinyin = this.haveSamePinyin(char1, char2);

    return {
      sharedRadicals,
      samePinyin,
      pinyinSound: samePinyin ? this.removeTones(char1.pinyin) : null
    };
  }

  /**
   * Get radicals that appear in both characters
   * Also checks if one character itself appears as a radical in the other
   * e.g., 舌 appears as a component in 话
   */
  private getSharedRadicals(char1: CharacterDTO, char2: CharacterDTO): string[] {
    const shared: string[] = [];

    if (!char1.radicals && !char2.radicals) return [];

    // Get radical lists
    const radicals1 = char1.radicals?.map(r => r.radical) || [];
    const radicals2 = char2.radicals?.map(r => r.radical) || [];

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
