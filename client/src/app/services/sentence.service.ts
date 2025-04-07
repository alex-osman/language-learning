import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SentenceDTO {
  id: number;
  sentence: string;
  pinyin: string;
  translation: string;
  audioUrl?: string;
  source?: string;
  level?: number;
  easinessFactor?: number;
  repetitions?: number;
  interval?: number;
  nextReviewDate?: Date;
  lastReviewDate?: Date;
  dueForReview?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SentenceService {
  private apiUrl = '/api/sentences';

  constructor(private http: HttpClient) {}

  getAllSentences(): Observable<SentenceDTO[]> {
    return this.http.get<SentenceDTO[]>(this.apiUrl);
  }

  getSentenceById(id: number): Observable<SentenceDTO> {
    return this.http.get<SentenceDTO>(`${this.apiUrl}/${id}`);
  }
}
