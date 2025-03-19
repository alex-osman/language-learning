import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TtsService } from '../../services/tts.service';
import { ChatService } from '../../services/chat.service';

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-interactive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interactive.component.html',
  styleUrls: ['./interactive.component.scss'],
})
export class InteractiveComponent {
  textInput: string = '';
  speed: 'normal' | 'slow' = 'normal';
  isLoading: boolean = false;
  isChatLoading: boolean = false;
  error: string | null = null;
  chatHistory: ChatMessage[] = [];

  constructor(private ttsService: TtsService, private chatService: ChatService) {}

  async onSubmit() {
    if (this.textInput.trim()) {
      try {
        this.isLoading = true;
        this.error = null;
        await this.ttsService.generateSpeech(this.textInput, this.speed);
      } catch (error) {
        console.error('Failed to generate speech:', error);
        this.error = 'Failed to generate speech. Please try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onChat() {
    if (this.textInput.trim()) {
      try {
        this.isChatLoading = true;
        this.error = null;

        // Add user message to chat history immediately
        this.addMessageToHistory(this.textInput, true);
        const userText = this.textInput;

        // Clear input right away for better UX
        this.textInput = '';

        // Get AI response
        const response = await this.chatService.generateResponse(userText);

        // Add AI response to chat history
        this.addMessageToHistory(response, false);
      } catch (error) {
        console.error('Failed to generate chat response:', error);
        this.error = 'Failed to get response. Please try again.';
      } finally {
        this.isChatLoading = false;
      }
    }
  }

  private addMessageToHistory(content: string, isUser: boolean) {
    this.chatHistory.push({
      content,
      isUser,
      timestamp: new Date(),
    });
  }

  // Start a new conversation
  onNewConversation() {
    this.chatService.resetConversation();
    this.chatHistory = [];
    this.error = null;
  }

  // Format timestamp for display
  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
