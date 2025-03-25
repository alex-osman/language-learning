import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Actor, RadicalProp } from '../interfaces/mandarin-blueprint.interface';
import {
  TWO_LETTER_INITIALS,
  FINAL_MAPPINGS,
  INITIAL_MAPPINGS,
  TONE_MAP,
  VOWEL_MAP,
} from '../constants/pinyin.constants';

type Sets = { [key: string]: string };
export type Tone = { [key: string]: string };

export interface Character {
  character: string;
  pinyin?: string;
  definition?: string;
  radicals?: string[];
  movie?: string;
}

export interface MovieScene {
  initial: string;
  final: string;
  actor: string;
  set: string;
  tone: string;
  movie?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = '/api/data';

  constructor(private http: HttpClient) {}

  // API methods
  getActors(): Observable<Actor[]> {
    return this.http.get<Actor[]>(`${this.apiUrl}/actors`);
  }

  getSets(): Observable<Sets> {
    return this.http.get<Sets>(`${this.apiUrl}/sets`);
  }

  getTones(): Observable<Tone> {
    return this.http.get<Tone>(`${this.apiUrl}/tones`);
  }

  getRadicalProps(): Observable<RadicalProp[]> {
    return this.http.get<RadicalProp[]>(`${this.apiUrl}/radicalProps`);
  }

  getCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>(`${this.apiUrl}/characters`);
  }

  // Helper method to get tone number from pinyin
  getToneNumber(pinyin: string): string {
    for (const char of pinyin) {
      const tone = TONE_MAP[char];
      if (tone) return tone;
    }
    return '5';
  }

  // Helper function to remove tone marks from pinyin
  private removeToneMarks(pinyin: string): string {
    return pinyin
      .toLowerCase()
      .split('')
      .map(char => VOWEL_MAP[char] || char)
      .join('');
  }

  // Helper function to parse pinyin into initial and final
  private parsePinyin(pinyinNoTones: string): { initial: string; final: string } {
    if (!pinyinNoTones) return { initial: '', final: '' };
    if (pinyinNoTones === 'er') return { initial: 'ø', final: 'er' };

    let initial = '';
    let final = '';

    // Handle special cases first
    if (pinyinNoTones.startsWith('shu')) {
      initial = 'shu';
      final = pinyinNoTones.substring(3);
    } else if (['shi', 'chi', 'zhi'].some(i => pinyinNoTones.startsWith(i))) {
      initial = pinyinNoTones.substring(0, 2);
      final = '';
    } else if (TWO_LETTER_INITIALS.some(i => pinyinNoTones.startsWith(i))) {
      initial = pinyinNoTones.substring(0, 2);
      final = pinyinNoTones.substring(2);
    } else {
      const firstChar = pinyinNoTones[0];
      if (firstChar === 'w' || firstChar === 'y') {
        initial = firstChar;
        final = '';
      } else if ((firstChar === 'd' || firstChar === 'r') && pinyinNoTones[1] === 'u') {
        initial = pinyinNoTones.substring(0, 2);
        final = pinyinNoTones.substring(2);
      } else {
        // For non-standard inputs, don't apply INITIAL_MAPPINGS
        initial = firstChar;
        final = pinyinNoTones.substring(1);
      }
    }

    return { initial, final };
  }

  // Helper function to map finals to their correct form
  private mapFinal(final: string): string {
    return FINAL_MAPPINGS[final] || final;
  }

  // Helper function to find the appropriate actor
  private findActor(initial: string, actors: Actor[]): string {
    const matchingActor = actors.find(a => a.initial === initial);
    const fallbackActor = actors.find(a => a.initial === 'ø');
    return matchingActor?.name || fallbackActor?.name || '(No actor assigned)';
  }

  // Helper function to get the appropriate set
  private getSetLocation(final: string, sets: Sets): string {
    const setKey = final ? `-${final}` : 'null';
    return sets[setKey] || sets['null'];
  }

  // Main function to get movie scene data
  async getMovieScene(pinyin: string): Promise<MovieScene | null> {
    try {
      const [actors, sets] = await Promise.all([
        firstValueFrom(this.getActors()),
        firstValueFrom(this.getSets()),
      ]);

      if (!actors?.length || !sets) return null;

      const pinyinNoTones = this.removeToneMarks(pinyin);
      const { initial, final } = this.parsePinyin(pinyinNoTones);
      const mappedFinal = this.mapFinal(final);
      const actor = this.findActor(initial, actors);
      const set = this.getSetLocation(mappedFinal, sets);
      const tone = this.getToneNumber(pinyin);

      return { initial, final: mappedFinal, actor, set, tone };
    } catch (error) {
      console.error('Error getting movie scene:', error);
      return null;
    }
  }
}
