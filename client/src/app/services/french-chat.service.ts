import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface FrenchChatResponse {
  french: string;
  english: string;
  conversationId: string;
}

@Injectable({
  providedIn: 'root',
})
export class FrenchChatService {
  private readonly API_URL = '/api/ai/french-chat';
  private currentConversationId: string | null = null;

  constructor(private http: HttpClient) {}

  generateResponse(text: string): Observable<FrenchChatResponse> {
    const request = {
      text,
      conversationId: this.currentConversationId,
    };
    return this.http.post<FrenchChatResponse>(this.API_URL, request).pipe(
      tap(res => {
        this.currentConversationId = res.conversationId;
      })
    );
  }

  resetConversation(): void {
    this.currentConversationId = null;
  }

  hasActiveConversation(): boolean {
    return this.currentConversationId !== null;
  }
}
