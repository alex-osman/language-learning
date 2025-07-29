import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserSentenceKnowledgeDTO = {
  knownCharacters: number;
  totalUniqueCharacters: number;
  unknownCharacters: number;
  easinessFactor: number;
  comprehensionPercentage: number;
};
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

// NEW: Enhanced interface for three-state analysis
export interface AnalyzedCharacterEnhanced {
  char: string;
  status: 'unknown' | 'seen' | 'learning' | 'learned';
  charData?: any;
  count: number;
}

export interface EnhancedSentenceAnalysisResult {
  learned_characters: string[];
  seen_characters: string[];
  unknown_characters: string[];
  learning_characters: string[];
  learned_count: number;
  seen_count: number;
  unknown_count: number;
  learning_count: number;
  total_characters: number;
  learned_percent: number;
  seen_percent: number;
  unknown_percent: number;
  all_characters: AnalyzedCharacterEnhanced[];
}

@Injectable({
  providedIn: 'root',
})
export class SentenceAnalysisService {
  private apiUrl = '/api/sentence-analyzer';

  constructor(private http: HttpClient) {}

  analyzeSentenceId(sentenceId: string): Observable<SentenceAnalysisResult> {
    return this.http.post<SentenceAnalysisResult>(
      `${this.apiUrl}/analyze-sentence/${sentenceId}`,
      {}
    );
  }

  analyzeEpisode(episodeId: number): Observable<UserSentenceKnowledgeDTO[]> {
    return this.http.post<UserSentenceKnowledgeDTO[]>(
      `${this.apiUrl}/analyze-episode/${episodeId}`,
      {
        episodeId,
      }
    );
  }

  analyzeSentence(text: string): Observable<SentenceAnalysisResult> {
    return this.http.post<SentenceAnalysisResult>(`${this.apiUrl}/analyze`, { text });
  }

  // NEW: Enhanced analysis with three states
  analyzeTextWithKnowledgeStatus(text: string): Observable<EnhancedSentenceAnalysisResult> {
    return this.http.post<EnhancedSentenceAnalysisResult>(`${this.apiUrl}/analyze-enhanced`, {
      text,
    });
  }

  analyzeTextsWithKnowledgeStatus(texts: string[]): Observable<EnhancedSentenceAnalysisResult[]> {
    return this.http.post<EnhancedSentenceAnalysisResult[]>(
      `${this.apiUrl}/analyze-batch-enhanced`,
      {
        texts,
      }
    );
  }
}
