import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CharacterDTO } from './data.service';

export interface EpisodeDTO {
  id: number;
  title: string;
  assetUrl: string;
  scenes: Scene[];
}

export interface ProgressInfo {
  knownCache: number;
}

export interface Sentence {
  id: number;
  sentence: string;
  translation: string;
  pinyin?: string;
  startMs: number;
  endMs: number;
}

export interface Scene {
  id: number;
  title: string;
  assetUrl: string;
  sentences: Sentence[];
  knownCache: number;
}

export interface SceneDTO {
  id: number;
  episodeId: number;
  title: string;
  assetUrl: string;
  number: number;
  sentences: Sentence[];
}

export interface Episode {
  id: number;
  title: string;
  number: number;
  scenes: Scene[];
  knownCache: number;
}

export interface Season {
  id: number;
  title: string;
  number: number;
  episodes: Episode[];
  progress: ProgressInfo;
}

export interface Media {
  id: number;
  title: string;
  type: 'tv' | 'movie';
  imageUrl?: string;
  seasons?: Season[]; // for TV
  episodes?: Episode[]; // for movies (optional)
  knownCache: number;
}

export interface YouTubeImportRequest {
  youtubeUrl: string;
  seasonId: number;
  title?: string;
  preferredLanguage?: string;
  dryRun?: boolean;
}

export interface YouTubeImportResult {
  episode: Episode | null;
  scene: Scene | null;
  sentencesImported: number;
  videoUrl: string;
  success: boolean;
  message: string;
  previewData?: {
    videoTitle: string;
    availableSubtitles: string[];
    subtitlePreviews: Array<{
      language: string;
      filename: string;
      preview: string;
      entryCount: number;
      isMultiFormat?: boolean;
      contentAnalysis?: string;
    }>;
    parsedEntries: number;
  };
}

export const SCENE_1_SENTENCES: Sentence[] = [
  {
    id: 1,
    sentence: '最好的朋友',
    translation: 'Best friends',
    pinyin: 'Zuì hǎo de péngyǒu',
    startMs: 8656,
    endMs: 12936,
  },
  {
    id: 2,
    sentence: '佩奇在等他最好的朋友小羊苏西。',
    translation: 'Peppa is waiting for her best friend, Little Sheep Suzy.',
    pinyin: 'Pèi qí zài děng tā zuì hǎo de péngyǒu Xiǎo Yáng Sū xī.',
    startMs: 15059,
    endMs: 20420,
  },
  {
    id: 3,
    sentence: '你好，苏西。你好，佩奇。',
    translation: 'Hello, Suzy. Hello, Peppa.',
    pinyin: 'Nǐ hǎo, Sū xī. Nǐ hǎo, Pèi qí.',
    startMs: 23483,
    endMs: 27765,
  },
  {
    id: 4,
    sentence: '小羊苏西来找佩奇玩了。',
    translation: 'Little Sheep Suzy has come to play with Peppa.',
    pinyin: 'Xiǎo yáng Sū xī lái zhǎo Pèi qí wán le.',
    startMs: 27765,
    endMs: 29326,
  },
  {
    id: 5,
    sentence: '佩奇喜欢苏西，苏西也喜欢佩奇。',
    translation: 'Peppa likes Suzy, and Suzy also likes Peppa.',
    pinyin: 'Pèi qí xǐ huān Sū xī, Sū xī yě xǐ huān Pèi qí.',
    startMs: 33143,
    endMs: 37025,
  },
  {
    id: 6,
    sentence: '他们是最好的朋友。',
    translation: 'They are best friends.',
    pinyin: 'Tā men shì zuì hǎo de péng yǒu.',
    startMs: 37025,
    endMs: 41186,
  },
  {
    id: 7,
    sentence: '佩奇，你为什么不和苏西去你的卧室玩好',
    translation: "Peppa, why don't you and Suzy go play in your bedroom?",
    pinyin: 'Pèi qí, nǐ wèishéme bù hé Sū xī qù nǐ de wò shì wán ne?',
    startMs: 44890,
    endMs: 48000,
  },
  {
    id: 8,
    sentence: '好的妈妈',
    translation: 'Okay, Mom.',
    pinyin: 'Hǎo de, mā ma',
    startMs: 48000,
    endMs: 52015,
  },
  {
    id: 9,
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
        id: 1,
        title: 'Peppa Pig',
        type: 'tv',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/en/thumb/8/86/Peppa_Pig_logo.svg/250px-Peppa_Pig_logo.svg.png',
        knownCache: 40,
      },
      {
        id: 2,
        title: 'Jiayun',
        type: 'tv',
        imageUrl: 'https://i3.ytimg.com/vi/oaA5N6Wso_o/hqdefault.jpg',
        knownCache: 80,
      },
    ]);
  }

  getSeasonsForMedia(mediaId: number): Observable<Season[]> {
    // TODO: Replace with real API call
    return of([
      {
        id: 1,
        title: 'Season 1',
        number: 1,
        episodes: [],
        progress: { knownCache: 50 },
      },
    ]);
  }

  getEpisodesForMedia(mediaId: number): Observable<Episode[]> {
    return this.http.get<Episode[]>(`/api/episodes/${mediaId}/media-episodes`);
  }

  getScenesForEpisode(episodeId: number): Observable<EpisodeDTO> {
    return this.http.get<EpisodeDTO>(`/api/episodes/${episodeId}/scenes`);
  }

  getScene(sceneId: number): Observable<SceneDTO> {
    return this.http.get<SceneDTO>(`/api/scenes/${sceneId}`);
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

  getCharactersForEpisode(episodeId: number): Observable<CharacterDTO[]> {
    return this.http.get<CharacterDTO[]>(`/api/episodes/${episodeId}/characters`);
  }

  importFromYouTube(request: YouTubeImportRequest): Observable<YouTubeImportResult> {
    return this.http.post<YouTubeImportResult>('/api/youtube-import', request);
  }

  deleteEpisode(episodeId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/episodes/${episodeId}`);
  }
}
