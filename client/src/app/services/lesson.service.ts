import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type WordKnowledgeStatus = 'unknown' | 'seen' | 'learning' | 'learned';

export interface LessonSummaryDTO {
  lessonNumber: number;
  wordCount: number;
  seenCount: number;
  learningCount: number;
  learnedCount: number;
}

export interface LessonWordDTO {
  id: number;
  word: string;
  pinyin: string;
  definition: string;
  partOfSpeech?: string | null;
  isProperNoun: boolean;
  knowledgeStatus: WordKnowledgeStatus;
}

export type CharKnowledgeStatus = 'unknown' | 'seen' | 'learning' | 'learned';

export interface CharKnowledgeDTO {
  status: CharKnowledgeStatus;
  score: number;
  pinyin?: string;
  definition?: string;
  easinessFactor?: number;
  repetitions?: number;
}

export interface LessonSentenceDTO {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  dialogueNumber: number;
  sequenceOrder: number;
}

export interface LessonDetailDTO {
  lessonNumber: number;
  words: LessonWordDTO[];
  charKnowledge: Record<string, CharKnowledgeDTO>;
  dialogues: LessonSentenceDTO[][];
}

@Injectable({ providedIn: 'root' })
export class LessonService {
  private apiUrl = '/api/lessons';

  constructor(private http: HttpClient) {}

  getLessons(): Observable<LessonSummaryDTO[]> {
    return this.http.get<LessonSummaryDTO[]>(this.apiUrl);
  }

  getLesson(lessonNumber: number): Observable<LessonDetailDTO> {
    return this.http.get<LessonDetailDTO>(`${this.apiUrl}/${lessonNumber}`);
  }

  autoMarkLearned(lessonNumber: number): Observable<number[]> {
    return this.http.post<number[]>(`${this.apiUrl}/${lessonNumber}/auto-mark-learned`, {});
  }

  markAllSeen(lessonNumber: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${lessonNumber}/mark-all-seen`, {});
  }

  markWordSeen(wordId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/words/${wordId}/seen`, {});
  }

  markWordKnown(wordId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/words/${wordId}/known`, {});
  }

  resetWordKnown(wordId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/words/${wordId}/known`);
  }
}
