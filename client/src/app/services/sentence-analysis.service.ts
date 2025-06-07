import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalyzedCharacter {
  char: string;
  known: boolean;
  charData?: any;
  count: number;
}

export interface SentenceAnalysisResult {
  known_characters: string[];
  unknown_characters: string[];
  known_count: number;
  unknown_count: number;
  total_characters: number;
  known_percent: number;
  all_characters: AnalyzedCharacter[];
}

@Injectable({
  providedIn: 'root',
})
export class SentenceAnalysisService {
  private apiUrl = '/api/sentence-analyzer';

  constructor(private http: HttpClient) {}

  analyzeSentence(text: string): Observable<SentenceAnalysisResult> {
    return this.http.post<SentenceAnalysisResult>(`${this.apiUrl}/analyze`, { text });
  }
}
