import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  chinese: string;
  pinyin: string;
  english: string;
  conversationId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly API_URL = '/api/ai/chat';
  private currentConversationId: string | null = null;

  constructor(private http: HttpClient) {}

  generateResponse(text: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.API_URL, { text });
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
