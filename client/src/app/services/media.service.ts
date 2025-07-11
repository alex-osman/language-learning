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
  progress?: ProgressInfo;
}

export interface Scene {
  id: string;
  title: string;
  number: number;
  sentences: Sentence[];
  progress?: ProgressInfo;
}

export interface Episode {
  id: string;
  title: string;
  number: number;
  scenes: Scene[];
  progress?: ProgressInfo;
}

export interface Season {
  id: string;
  title: string;
  number: number;
  episodes: Episode[];
  progress?: ProgressInfo;
}

export interface Media {
  id: string;
  title: string;
  type: 'tv' | 'movie';
  imageUrl?: string;
  seasons?: Season[]; // for TV
  episodes?: Episode[]; // for movies (optional)
  progress?: ProgressInfo;
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
        id: 'e1',
        title: 'Episode 1',
        number: 1,
        scenes: [],
        progress: { percentKnown: 60, knownCharacters: 60, totalCharacters: 100 },
      },
      {
        id: 'e2',
        title: 'Episode 2',
        number: 2,
        scenes: [],
        progress: { percentKnown: 20, knownCharacters: 20, totalCharacters: 100 },
      },
    ]);
  }

  getScenesForEpisode(mediaId: string, seasonId: string, episodeId: string): Observable<Scene[]> {
    // TODO: Replace with real API call
    return of([
      {
        id: 'sc1',
        title: 'Scene 1',
        number: 1,
        sentences: [],
        progress: { percentKnown: 80, knownCharacters: 8, totalCharacters: 10 },
      },
      {
        id: 'sc2',
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
        id: 'sen1',
        chinese: '我上班了',
        translation: 'I have to go to work',
        knownCharacters: 3,
        totalCharacters: 4,
        progress: { percentKnown: 75, knownCharacters: 3, totalCharacters: 4 },
      },
      {
        id: 'sen2',
        chinese: '你吃了吗？',
        translation: 'Have you eaten?',
        knownCharacters: 2,
        totalCharacters: 4,
        progress: { percentKnown: 50, knownCharacters: 2, totalCharacters: 4 },
      },
    ]);
  }
}
