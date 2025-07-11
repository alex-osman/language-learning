import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ProgressInfo {
  percentKnown: number; // 0-100
  knownCharacters: number;
  totalCharacters: number;
}

export interface Sentence {
  id: string;
  chinese: string;
  translation: string;
  pinyin?: string;
  knownCharacters: number;
  totalCharacters: number;
}

export interface Scene {
  id: string;
  title: string;
  number: number;
  sentences: Sentence[];
  progress: ProgressInfo;
}

export interface Episode {
  id: string;
  title: string;
  number: number;
  scenes: Scene[];
  progress: ProgressInfo;
}

export interface Season {
  id: string;
  title: string;
  number: number;
  episodes: Episode[];
  progress: ProgressInfo;
}

export interface Media {
  id: string;
  title: string;
  type: 'tv' | 'movie';
  imageUrl?: string;
  seasons?: Season[]; // for TV
  episodes?: Episode[]; // for movies (optional)
  progress: ProgressInfo;
}

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  constructor() {}

  getAllMedia(): Observable<Media[]> {
    // TODO: Replace with real API call
    return of([
      {
        id: 'peppa',
        title: 'Peppa Pig',
        type: 'tv',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e6/Peppa_Pig_characters.png',
        progress: { percentKnown: 40, knownCharacters: 200, totalCharacters: 500 },
      },
      {
        id: 'shrek',
        title: 'Shrek',
        type: 'movie',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/3/39/Shrek.jpg',
        progress: { percentKnown: 80, knownCharacters: 400, totalCharacters: 500 },
      },
    ]);
  }

  getSeasonsForMedia(mediaId: string): Observable<Season[]> {
    // TODO: Replace with real API call
    return of([
      {
        id: 's1',
        title: 'Season 1',
        number: 1,
        episodes: [],
        progress: { percentKnown: 50, knownCharacters: 100, totalCharacters: 200 },
      },
      {
        id: 's2',
        title: 'Season 2',
        number: 2,
        episodes: [],
        progress: { percentKnown: 30, knownCharacters: 60, totalCharacters: 200 },
      },
    ]);
  }

  getEpisodesForSeason(mediaId: string, seasonId: string): Observable<Episode[]> {
    // TODO: Replace with real API call
    return of([
      {
        id: '1',
        title: 'Episode 1 - Something',
        number: 1,
        scenes: [],
        progress: { percentKnown: 60, knownCharacters: 60, totalCharacters: 100 },
      },
      {
        id: '2',
        title: 'Episode 2 - Something Else',
        number: 2,
        scenes: [],
        progress: { percentKnown: 20, knownCharacters: 20, totalCharacters: 100 },
      },
      {
        id: '3',
        title: 'Episode 3 - Best Friends',
        number: 3,
        scenes: [],
        progress: { percentKnown: 20, knownCharacters: 20, totalCharacters: 100 },
      },
    ]);
  }

  getScenesForEpisode(mediaId: string, seasonId: string, episodeId: string): Observable<Scene[]> {
    // TODO: Replace with real API call
    return of([
      {
        id: '1',
        title: 'Scene 1',
        number: 1,
        sentences: [],
        progress: { percentKnown: 80, knownCharacters: 8, totalCharacters: 10 },
      },
      {
        id: '2',
        title: 'Scene 2',
        number: 2,
        sentences: [],
        progress: { percentKnown: 50, knownCharacters: 5, totalCharacters: 10 },
      },
    ]);
  }

  getSentencesForScene(
    mediaId: string,
    seasonId: string,
    episodeId: string,
    sceneId: string
  ): Observable<Sentence[]> {
    // TODO: Replace with real API call
    return of([
      {
        id: '1',
        chinese: '最好的朋友',
        translation: 'Best friends',
        pinyin: 'Zuì hǎo de péngyǒu',
        knownCharacters: 0,
        totalCharacters: 5,
      },
      {
        id: '2',
        chinese: '佩奇在等他。最好的朋友小羊苏西。',
        translation: 'Peppa is waiting for her — her best friend, Little Sheep Suzy.',
        pinyin: 'Pèi qí zài děng tā. Zuì hǎo de péngyǒu Xiǎo Yáng Sū xī.',
        knownCharacters: 0,
        totalCharacters: 14,
      },
      {
        id: '3',
        chinese: '你好，苏西。你好，佩奇。',
        translation: 'Hello, Suzy. Hello, Peppa.',
        pinyin: 'Nǐ hǎo, Sū xī. Nǐ hǎo, Pèi qí.',
        knownCharacters: 0,
        totalCharacters: 8,
      },
      {
        id: '4',
        chinese: '小羊苏西来找佩奇玩了。',
        translation: 'Little Sheep Suzy has come to play with Peppa.',
        pinyin: 'Xiǎo yáng Sū xī lái zhǎo Pèi qí wán le.',
        knownCharacters: 0,
        totalCharacters: 10,
      },
      {
        id: '5',
        chinese: '佩奇喜欢苏西，苏西也喜欢佩奇。',
        translation: 'Peppa likes Suzy, and Suzy also likes Peppa.',
        pinyin: 'Pèi qí xǐ huān Sū xī, Sū xī yě xǐ huān Pèi qí.',
        knownCharacters: 0,
        totalCharacters: 13,
      },
      {
        id: '6',
        chinese: '他们是最好的朋友。',
        translation: 'They are best friends.',
        pinyin: 'Tā men shì zuì hǎo de péng yǒu.',
        knownCharacters: 0,
        totalCharacters: 8,
      },
      {
        id: '7',
        chinese: '佩奇，',
        translation: 'Peppa,',
        pinyin: 'Pèi qí,',
        knownCharacters: 0,
        totalCharacters: 2,
      },
      {
        id: '8',
        chinese: '你为什么不和苏西去你的卧室玩好',
        translation: 'Why don’t you and Suzy go play in your bedroom?',
        pinyin: 'Nǐ wèishéme bù hé Sū xī qù nǐ de wò shì wán ne?',
        knownCharacters: 0,
        totalCharacters: 15,
      },
      {
        id: '9',
        chinese: '好的妈妈？乔治也想一起玩。',
        translation: 'Okay, Mom? George wants to play too.',
        pinyin: 'Hǎo de, mā ma? Qiáo zhì yě xiǎng yì qǐ wán.',
        knownCharacters: 0,
        totalCharacters: 10,
      },
      {
        id: '10',
        chinese: '佩奇和苏西喜欢在佩奇的卧室里玩。',
        translation: 'Peppa and Suzy like playing in Peppa’s bedroom.',
        pinyin: 'Pèi qí hé Sū xī xǐ huān zài Pèi qí de wò shì lǐ wán.',
        knownCharacters: 0,
        totalCharacters: 15,
      },
    ]);
  }
}
