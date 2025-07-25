import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

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
  // Episode context
  episodeId?: number;
  startMs?: number;
  endMs?: number;
}

export interface EpisodeProgressStats {
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
  getSentencesForEpisode(
    episodeId: number
  ): Observable<{ title: string; assetUrl: string; sentences: SentenceDTO[]; total: number }> {
    return this.http.get<{
      title: string;
      assetUrl: string;
      sentences: SentenceDTO[];
      total: number;
    }>(`${this.baseUrl}/episode/${episodeId}`, {
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
   * Get episode progress statistics
   */
  getEpisodeProgress(episodeId: number): Observable<EpisodeProgressStats> {
    return this.http.get<EpisodeProgressStats>(`${this.baseUrl}/episode/${episodeId}/progress`);
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
