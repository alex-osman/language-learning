import { Injectable } from '@angular/core';
import { DICTIONARY_DATA } from '../data/dictionary.data';
import {
  TONE_MAP,
  TONE_MARKS,
  PINYIN_INITIALS,
  PINYIN_FINALS,
  CHINESE_PUNCTUATION,
} from '../types/pinyin.types';

export const AUDIO_BASE_URL = 'https://cdn.yoyochinese.com/audio/pychart/';

@Injectable({
  providedIn: 'root',
})
export class PinyinService {
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {}

  getDefinition(chars: string): string {
    return (
      DICTIONARY_DATA[chars as keyof typeof DICTIONARY_DATA] ||
      `(definition not found for "${chars}")`
    );
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
    // Find the tone number by looking for tone marks
    let toneNumber = 1; // Default to tone 1
    let base = syllable.toLowerCase();

    // First pass: look for tone marks in the original syllable
    for (const [mark, number] of Object.entries(TONE_MAP)) {
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
    return base.replace(vowelToModify, TONE_MARKS[vowelToModify][toneNum] || vowelToModify);
  }

  private splitPinyinWord(pinyin: string): string[] {
    // Handle empty or null input
    if (!pinyin) return [];

    // Remove any spaces and convert to lowercase for consistent processing
    pinyin = pinyin.trim().toLowerCase();

    // Split the input into syllables
    const syllables: string[] = [];
    let remaining = pinyin;

    while (remaining.length > 0) {
      // Try to match a complete syllable at the start of the remaining string
      const syllablePattern = new RegExp(`^(?:${PINYIN_INITIALS})?(?:${PINYIN_FINALS})`, 'i');
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
    return CHINESE_PUNCTUATION.includes(char);
  }

  async playAudioFile(url: string): Promise<void> {
    // Stop any currently playing audio
    this.stop();

    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = error => {
        console.error('Error playing audio:', error);
        this.currentAudio = null;
        resolve(); // Resolve anyway to continue with next audio file
      };

      audio.play().catch(error => {
        console.error('Error starting audio playback:', error);
        this.currentAudio = null;
        resolve(); // Resolve anyway to continue with next audio file
      });
    });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
}
