import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface EpisodeDTO {
  id: string;
  title: string;
  assetUrl: string;
  scenes: Scene[];
}

export interface ProgressInfo {
  percentKnown: number; // 0-100
  knownCharacters: number;
  totalCharacters: number;
}

export interface Sentence {
  id: string;
  sentence: string;
  translation: string;
  pinyin?: string;
  startMs: number;
  endMs: number;
}

export interface Scene {
  id: string;
  title: string;
  assetUrl: string;
  sentences: Sentence[];
  knownCache: number;
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

export const SCENE_1_SENTENCES: Sentence[] = [
  {
    id: '1',
    sentence: '最好的朋友',
    translation: 'Best friends',
    pinyin: 'Zuì hǎo de péngyǒu',
    startMs: 8656,
    endMs: 12936,
  },
  {
    id: '2',
    sentence: '佩奇在等他最好的朋友小羊苏西。',
    translation: 'Peppa is waiting for her best friend, Little Sheep Suzy.',
    pinyin: 'Pèi qí zài děng tā zuì hǎo de péngyǒu Xiǎo Yáng Sū xī.',
    startMs: 15059,
    endMs: 20420,
  },
  {
    id: '3',
    sentence: '你好，苏西。你好，佩奇。',
    translation: 'Hello, Suzy. Hello, Peppa.',
    pinyin: 'Nǐ hǎo, Sū xī. Nǐ hǎo, Pèi qí.',
    startMs: 23483,
    endMs: 27765,
  },
  {
    id: '4',
    sentence: '小羊苏西来找佩奇玩了。',
    translation: 'Little Sheep Suzy has come to play with Peppa.',
    pinyin: 'Xiǎo yáng Sū xī lái zhǎo Pèi qí wán le.',
    startMs: 27765,
    endMs: 29326,
  },
  {
    id: '5',
    sentence: '佩奇喜欢苏西，苏西也喜欢佩奇。',
    translation: 'Peppa likes Suzy, and Suzy also likes Peppa.',
    pinyin: 'Pèi qí xǐ huān Sū xī, Sū xī yě xǐ huān Pèi qí.',
    startMs: 33143,
    endMs: 37025,
  },
  {
    id: '6',
    sentence: '他们是最好的朋友。',
    translation: 'They are best friends.',
    pinyin: 'Tā men shì zuì hǎo de péng yǒu.',
    startMs: 37025,
    endMs: 41186,
  },
  {
    id: '8a',
    sentence: '佩奇，你为什么不和苏西去你的卧室玩好',
    translation: "Peppa, why don't you and Suzy go play in your bedroom?",
    pinyin: 'Pèi qí, nǐ wèishéme bù hé Sū xī qù nǐ de wò shì wán ne?',
    startMs: 44890,
    endMs: 48000,
  },
  {
    id: '8b',
    sentence: '好的妈妈',
    translation: 'Okay, Mom.',
    pinyin: 'Hǎo de, mā ma',
    startMs: 48000,
    endMs: 52015,
  },
  {
    id: '9',
    sentence: '乔治也想一起玩。',
    translation: 'George wants to play too.',
    pinyin: 'Qiáo zhì yě xiǎng yì qǐ wán.',
    startMs: 52015,
    endMs: 56615,
  },
];

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  constructor(private http: HttpClient) {}

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

  getScenesForEpisode(episodeId: string): Observable<EpisodeDTO> {
    return this.http.get<EpisodeDTO>(`/api/episodes/${episodeId}/scenes`);
  }

  getScene(
    mediaId: string,
    seasonId: string,
    episodeId: string,
    sceneId: string
  ): Observable<Scene> {
    // TODO: Replace with real API call
    // return of({
    //   id: sceneId,
    //   title: 'Intro',
    //   assetUrl: 'assets/videos/scene1.mp4',
    //   sentences: SCENE_1_SENTENCES,
    //   progress: { percentKnown: 11, knownCharacters: 15, totalCharacters: 18 },
    // });
    return this.http.get<Scene>(`/api/scenes/${sceneId}`);
  }

  getSentencesForScene(
    mediaId: string,
    seasonId: string,
    episodeId: string,
    sceneId: string
  ): Observable<Sentence[]> {
    // TODO: Replace with real API call
    return of(SCENE_1_SENTENCES);
  }
}
