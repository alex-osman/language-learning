import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Actor, RadicalProp } from '../interfaces/mandarin-blueprint.interface';

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
  private apiUrl = '/api/data'; // Update this URL based on your backend configuration

  // Special case mappings that were previously in the component
  private readonly TWO_LETTER_INITIALS = ['zh', 'ch', 'sh', 'ji', 'qi', 'xi', 'du', 'ru', 'shu'];
  private readonly FINAL_MAPPINGS: { [key: string]: string } = {
    i: 'e',
    ie: 'e',
    r: 'er',
    u: 'ou',
    ü: 'ou',
  };
  private readonly INITIAL_MAPPINGS: { [key: string]: string } = {
    n: 'ni',
    j: 'ji',
    q: 'qi',
    x: 'xi',
  };

  constructor(private http: HttpClient) {}

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
    const toneMap: { [key: string]: string } = {
      ā: '1',
      ē: '1',
      ī: '1',
      ō: '1',
      ū: '1',
      ǖ: '1',
      á: '2',
      é: '2',
      í: '2',
      ó: '2',
      ú: '2',
      ǘ: '2',
      ǎ: '3',
      ě: '3',
      ǐ: '3',
      ǒ: '3',
      ǔ: '3',
      ǚ: '3',
      à: '4',
      è: '4',
      ì: '4',
      ò: '4',
      ù: '4',
      ǜ: '4',
    };

    for (const char of pinyin) {
      if (char in toneMap) {
        return toneMap[char];
      }
    }
    return '5';
  }

  // Helper method to parse pinyin and get movie scene data
  async getMovieScene(pinyin: string): Promise<MovieScene | null> {
    try {
      const [actors, sets] = await Promise.all([
        this.getActors().toPromise(),
        this.getSets().toPromise(),
      ]);

      if (!actors || !sets) return null;

      // Remove tone marks from pinyin
      const pinyinNoTones = pinyin
        .toLowerCase()
        .replace(
          /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g,
          match => 'aeiouü'['āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'.indexOf(match) % 5]
        );

      let initial = '';
      let final = '';

      // Parse initial and final using the same logic as before
      if (pinyinNoTones.startsWith('shu')) {
        initial = 'shu';
        final = pinyinNoTones.substring(3);
      } else if (
        pinyinNoTones.startsWith('shi') ||
        pinyinNoTones.startsWith('chi') ||
        pinyinNoTones.startsWith('zhi')
      ) {
        initial = pinyinNoTones.substring(0, 2);
        final = '';
      } else if (this.TWO_LETTER_INITIALS.some(i => pinyinNoTones.startsWith(i))) {
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
        } else if (firstChar in this.INITIAL_MAPPINGS) {
          initial = this.INITIAL_MAPPINGS[firstChar];
          final = pinyinNoTones.substring(1);
        } else {
          initial = firstChar;
          final = pinyinNoTones.substring(1);
        }
      }

      const mappedFinal = this.FINAL_MAPPINGS[final] || final;
      const matchingActor = actors.find(a => a.initial === initial);
      const fallbackActor = actors.find(a => a.initial === 'ø');
      const actor = matchingActor?.name || fallbackActor?.name || '(No actor assigned)';

      const setKey = final ? `-${mappedFinal}` : 'null';
      const set = sets[setKey] || sets['null'];
      const tone = this.getToneNumber(pinyin);

      return {
        initial,
        final: mappedFinal,
        actor,
        set,
        tone,
      };
    } catch (error) {
      console.error('Error getting movie scene:', error);
      return null;
    }
  }

  // Add other methods as needed for tones, characters, etc.
}
