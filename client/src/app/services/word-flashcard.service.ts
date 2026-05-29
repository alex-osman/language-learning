import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FlashWordDTO {
  wordId: number;
  word: string;
  pinyin: string;
  definition: string;
  partOfSpeech?: string | null;
  lessonNumber?: number | null;
  easinessFactor: number;
  repetitions: number;
  interval: number;
  nextReviewDate?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class WordFlashcardService {
  private apiUrl = '/api/word-flashcards';

  constructor(private http: HttpClient) {}

  getDueCards(): Observable<FlashWordDTO[]> {
    return this.http.get<FlashWordDTO[]>(`${this.apiUrl}/due`);
  }

  reviewCard(wordId: number, quality: number): Observable<FlashWordDTO> {
    return this.http.post<FlashWordDTO>(`${this.apiUrl}/${wordId}/review`, { quality });
  }
}
