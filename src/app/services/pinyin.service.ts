import { Injectable } from '@angular/core';
import { DICTIONARY_DATA } from '../data/dictionary.data';

export const AUDIO_BASE_URL = 'https://cdn.yoyochinese.com/audio/pychart/';

@Injectable({
  providedIn: 'root'
})
export class PinyinService {
  constructor() {}

  

  getDefinition(chars: string): string {
    return DICTIONARY_DATA[chars as keyof typeof DICTIONARY_DATA] || `(definition not found for "${chars}")`;
  }

  getAudioUrls(pinyin: string): string[] {
    // Split the pinyin into syllables and generate URLs
    const syllables = this.splitPinyinWord(pinyin);
    return syllables.map(syllable => this.getAudioUrlForSyllable(syllable));
  }

  private getAudioUrlForSyllable(syllable: string): string {
    // Convert pinyin with tone mark to number format (e.g., "mǔ" -> "mu3")
    const normalized = this.convertToneMarkToNumber(syllable.toLowerCase());
    return `${AUDIO_BASE_URL}${normalized}.mp3`;
  }

  private convertToneMarkToNumber(syllable: string): string {
    // Map of tone marks to numbers
    const toneMap: { [key: string]: number } = {
      'ā': 1, 'ē': 1, 'ī': 1, 'ō': 1, 'ū': 1, 'ǖ': 1,
      'á': 2, 'é': 2, 'í': 2, 'ó': 2, 'ú': 2, 'ǘ': 2,
      'ǎ': 3, 'ě': 3, 'ǐ': 3, 'ǒ': 3, 'ǔ': 3, 'ǚ': 3,
      'à': 4, 'è': 4, 'ì': 4, 'ò': 4, 'ù': 4, 'ǜ': 4
    };

    // Find the tone number by looking for tone marks
    let toneNumber = 1; // Default to tone 1
    let base = syllable.toLowerCase();

    // First pass: look for tone marks in the original syllable
    for (const [mark, number] of Object.entries(toneMap)) {
      if (syllable.includes(mark)) {
        toneNumber = number;
        // Remove tone mark and replace with the base vowel
        base = syllable.replace(mark, mark.normalize('NFD')[0]);
        break;
      }
    }

    // Convert 'v' to 'ü' if present (common pinyin typing convention)
    base = base.replace(/v/g, 'ü');

    return `${base}${toneNumber}`;
  }

  convertNumberToToneMark(syllable: string): string {
    // Map of vowels to their tone mark versions
    const toneMarks: { [key: string]: string[] } = {
      'a': ['a', 'ā', 'á', 'ǎ', 'à'],
      'e': ['e', 'ē', 'é', 'ě', 'è'],
      'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
      'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
      'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
      'ü': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ']
    };

    // Extract the tone number from the end of the syllable
    const match = syllable.match(/([a-zü]+)([1-5])$/i);
    if (!match) return syllable;

    const [_, base, tone] = match;
    const toneNum = parseInt(tone);
    if (toneNum < 1 || toneNum > 5) return base;

    // Find the vowel to modify (using standard Pinyin rules)
    const vowels = 'aeiouü';
    let vowelToModify = '';
    
    if (base.includes('a')) vowelToModify = 'a';
    else if (base.includes('e')) vowelToModify = 'e';
    else if (base.includes('ou')) vowelToModify = 'o';
    else {
      // Find the last vowel in the syllable
      for (let i = base.length - 1; i >= 0; i--) {
        if (vowels.includes(base[i])) {
          vowelToModify = base[i];
          break;
        }
      }
    }

    if (!vowelToModify) return base;

    // Replace the vowel with its tone mark version
    return base.replace(
      vowelToModify,
      toneMarks[vowelToModify][toneNum] || vowelToModify
    );
  }

  private splitPinyinWord(pinyin: string): string[] {
    // Handle empty or null input
    if (!pinyin) return [];
    
    // Remove any spaces and convert to lowercase for consistent processing
    pinyin = pinyin.trim().toLowerCase();
    
    // Common Pinyin initials (consonants)
    const initials = 'zh|ch|sh|b|p|m|f|d|t|n|l|g|k|h|j|q|x|r|z|c|s|y|w';
    
    // Common Pinyin finals (vowels and endings) with optional tone marks
    const finals = [
      // First handle syllables ending in 'n' with tone marks
      'i[āáǎàa]n|u[āáǎàa]n|[īíǐìi]an|[ūúǔùu]an|[āáǎàa]ng|[ēéěèe]ng|[īíǐìi]ng|[ōóǒòo]ng|[ūúǔùu]ng',
      // Then handle special cases with compound finals
      'i[āáǎàa]o|u[āáǎàa]o|[īíǐìi]ao|[ūúǔùu]ai',
      // Handle compound vowels with tone marks on either vowel
      'u[āáǎàa]|u[ōóǒòo]|i[āáǎàa]|i[ēéěèe]|[uü][ēéěèe]|[üǖǘǚǜ]e',
      // Handle compound vowels and diphthongs
      'ian|uan|[āáǎàa]n|[ēéěèe]n|[īíǐìi]n|[ōóǒòo]n|[ūúǔùu]n',
      'iao|uai|[āáǎàa]o|[āáǎàa]i|[ēéěèe]i|[ōóǒòo]u|[uü]o|[uü]i|[uü]a|ia|ie|ua|uo|üe',
      // Common endings
      'men',
      // Then single vowels with tone marks
      '[āáǎàa]|[ēéěèe]|[īíǐìi]|[ōóǒòo]|[ūúǔùu]|[üǖǘǚǜ]',
      // Special cases
      'er'
    ].join('|');
    
    // Split the input into syllables
    const syllables: string[] = [];
    let remaining = pinyin;
    
    while (remaining.length > 0) {
      // Try to match a complete syllable at the start of the remaining string
      const syllablePattern = new RegExp(`^(?:${initials})?(?:${finals})`, 'i');
      const match = remaining.match(syllablePattern);
      
      if (match) {
        syllables.push(match[0]);
        remaining = remaining.slice(match[0].length);
      } else {
        // If no match found, something's wrong
        console.warn(`Could not parse syllable in: ${remaining}`);
        syllables.push(remaining);
        break;
      }
    }
    
    return syllables;
  }

  checkPunctuation(char: string): boolean {
    // Check if a character is punctuation
    const punctuation = ['。', '，', '！', '？', '、', '；', '：', '"', '"', '\'', '\'', '（', '）', '《', '》'];
    return punctuation.includes(char);
  }

  async playAudioFile(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.onended = () => resolve();
      audio.onerror = (error) => {
        console.error('Error playing audio:', error);
        resolve(); // Resolve anyway to continue with next audio file
      };
      audio.play().catch(error => {
        console.error('Error starting audio playback:', error);
        resolve(); // Resolve anyway to continue with next audio file
      });
    });
  }
} 