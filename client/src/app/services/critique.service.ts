import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Language } from '@shared/types/languages';

export interface CritiqueRequest {
  text: string;
  conversationId?: string;
  mainConversationId?: string;
  isFollowUp?: boolean;
  language?: Language;
}

export interface CritiqueResponse {
  text: string;
  conversationId: string;
}

@Injectable({
  providedIn: 'root',
})
export class CritiqueService {
  private readonly API_URL = '/api/ai/critique';

  constructor(private http: HttpClient) {}

  generateCritique(request: CritiqueRequest): Observable<CritiqueResponse> {
    return this.http.post<CritiqueResponse>(this.API_URL, request);
  }

  resetConversation(): void {
    // Reset any stored conversation state if needed
  }
}
