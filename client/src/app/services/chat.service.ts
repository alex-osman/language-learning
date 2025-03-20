import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Language } from '@shared/types/languages';
export interface ChatResponse {
  base: string; // English
  target: string; // Chinese
  transliteration: string; // Pinyin
  conversationId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly API_URL = '/api/ai/chat';
  private currentConversationId: string | null = null;

  constructor(private http: HttpClient) {}

  generateResponse(text: string, targetLanguage: Language): Observable<ChatResponse> {
    const request = {
      language: targetLanguage,
      text,
      conversationId: this.currentConversationId,
    };
    return this.http.post<ChatResponse>(this.API_URL, request).pipe(
      tap(res => {
        this.currentConversationId = res.conversationId;
      })
    );
  }

  // Method to manually reset the conversation
  resetConversation(): void {
    this.currentConversationId = null;
  }

  // Method to check if we're in an active conversation
  hasActiveConversation(): boolean {
    return this.currentConversationId !== null;
  }
}
