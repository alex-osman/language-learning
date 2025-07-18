import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SCENE_1_SENTENCES } from './media.service';

export interface SentenceDTO {
  id: string;
  sentence: string;
  pinyin: string;
  translation: string;
  audioUrl?: string;
  source?: string;
  level?: number;
  // SRS fields
  easinessFactor: number;
  repetitions: number;
  interval: number;
  nextReviewDate?: Date;
  lastReviewDate?: Date;
  dueForReview: boolean;
  // Scene context
  sceneId?: string;
  startMs?: number;
  endMs?: number;
}

export interface SceneProgressStats {
  totalSentences: number;
  practicedSentences: number;
  averageEasiness: number;
  averageInterval: number;
  completionPercentage: number;
}

@Injectable({
  providedIn: 'root',
})
export class SentenceFlashcardService {
  private baseUrl = 'api/sentence-flashcards';

  constructor(private http: HttpClient) {}

  /**
   * Get all sentences for a specific scene
   */
  getSentencesForScene(
    sceneId: string
  ): Observable<{ title: string; assetUrl: string; sentences: SentenceDTO[]; total: number }> {
    // return of({
    //   title: 'Scene 1',
    //   assetUrl: 'assets/videos/scene1.mp4',

    //   sentences: SCENE_1_SENTENCES.map(s => ({
    //     id: s.id,
    //     sceneId,
    //     easinessFactor: 2.5,
    //     repetitions: 0,
    //     interval: 0,
    //     dueForReview: false,
    //     sentence: s.sentence,
    //     pinyin: s.pinyin || '',
    //     translation: s.translation,
    //     audioUrl: '',
    //     source: '',
    //     level: 0,
    //     startMs: s.startMs,
    //     endMs: s.endMs,
    //   })),
    //   total: SCENE_1_SENTENCES.length,
    // });

    return this.http.get<{
      title: string;
      assetUrl: string;
      sentences: SentenceDTO[];
      total: number;
    }>(`${this.baseUrl}/scene/${sceneId}`, {
      responseType: 'json',
    });
  }

  /**
   * Get practice sentences for a scene
   */
  getPracticeSentences(
    sceneId: string,
    limit?: number
  ): Observable<{ sentences: SentenceDTO[]; total: number }> {
    const url = `${this.baseUrl}/scene/${sceneId}/practice`;
    if (limit) {
      return this.http.get<{ sentences: SentenceDTO[]; total: number }>(url, {
        params: { limit: limit.toString() },
      });
    }
    return this.http.get<{ sentences: SentenceDTO[]; total: number }>(url);
  }

  /**
   * Get scene progress statistics
   */
  getSceneProgress(sceneId: string): Observable<SceneProgressStats> {
    return this.http.get<SceneProgressStats>(`${this.baseUrl}/scene/${sceneId}/progress`);
  }

  /**
   * Review a sentence
   */
  reviewSentence(sentenceId: string, quality: number): Observable<SentenceDTO> {
    return this.http.post<SentenceDTO>(`${this.baseUrl}/${sentenceId}/review`, { quality });
  }

  /**
   * Start learning a sentence
   */
  startLearning(sentenceId: string): Observable<SentenceDTO> {
    return this.http.post<SentenceDTO>(`${this.baseUrl}/${sentenceId}/learn`, {});
  }

  /**
   * Reset learning progress for a sentence
   */
  resetLearning(sentenceId: string): Observable<SentenceDTO> {
    return this.http.post<SentenceDTO>(`${this.baseUrl}/${sentenceId}/reset`, {});
  }
}
