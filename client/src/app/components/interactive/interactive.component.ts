import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TtsService } from '../../services/tts.service';
import { ChatService } from '../../services/chat.service';
import { CopyButtonComponent } from '../copy-button/copy-button.component';
import { SpeakButtonComponent } from '../speak-button/speak-button.component';
import { LanguageControlsComponent } from '../language-controls/language-controls.component';
import { InteractiveSidebarComponent } from '../interactive-sidebar/interactive-sidebar.component';

interface ChatMessage {
  chinese: string;
  pinyin: string;
  english: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-interactive',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CopyButtonComponent,
    SpeakButtonComponent,
    LanguageControlsComponent,
    InteractiveSidebarComponent,
  ],
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
  selectedLanguages: string[] = ['Chinese', 'Pinyin', 'English'];

  constructor(private ttsService: TtsService, private chatService: ChatService) {}

  onLanguageChange(languages: string[]) {
    this.selectedLanguages = languages;
  }

  isLanguageSelected(language: string): boolean {
    return this.selectedLanguages.includes(language);
  }

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
        this.addMessageToHistory({
          chinese: this.textInput,
          pinyin: '',
          english: '',
          isUser: true,
          timestamp: new Date(),
        });

        const userText = this.textInput;

        // Clear input right away for better UX
        this.textInput = '';

        // Get AI response
        const response = await this.chatService.generateResponse(userText);

        // Add AI response to chat history
        this.addMessageToHistory({
          ...response,
          isUser: false,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Failed to generate chat response:', error);
        this.error = 'Failed to get response. Please try again.';
      } finally {
        this.isChatLoading = false;
      }
    }
  }

  private addMessageToHistory(message: ChatMessage) {
    this.chatHistory.push(message);
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
