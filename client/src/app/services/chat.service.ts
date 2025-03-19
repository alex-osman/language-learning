import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface ChatResponse {
  response: string;
  conversationId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private currentConversationId: string | null = null;

  constructor(private http: HttpClient) {}

  async generateResponse(text: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post<ChatResponse>('/api/ai/chat', {
          text,
          conversationId: this.currentConversationId,
        })
      );

      // Store the conversation ID for subsequent requests
      this.currentConversationId = response.conversationId;
      return response.response;
    } catch (error) {
      console.error('Failed to generate chat response:', error);
      // If there's an error with the conversation, we might want to reset it
      if (
        (error as any).status === 404 ||
        (error as any).message?.includes('Conversation not found')
      ) {
        this.currentConversationId = null;
      }
      throw error;
    }
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
