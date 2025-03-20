import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { CritiqueService } from '../../services/critique.service';
import { TtsService } from '../../services/tts.service';
import { ChatBoxComponent, ChatBoxConfig, ChatMessage } from '../chat-box/chat-box.component';

@Component({
  selector: 'app-interactive',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatBoxComponent],
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
  critiqueHistory: ChatMessage[] = [];
  currentConversationId?: string;
  currentCritiqueId?: string;
  selectedLanguages: string[] = ['Chinese', 'Pinyin', 'English'];

  mainChatConfig: ChatBoxConfig = {
    showLanguageControls: true,
    showCopyButton: true,
    showSpeakButton: true,
    showNewConversationButton: false,
    multiLanguageSupport: true,
    height: '100%',
    placeholder: 'Type your message in any language...',
  };

  critiqueChatConfig: ChatBoxConfig = {
    showLanguageControls: false,
    showCopyButton: false,
    showSpeakButton: false,
    showNewConversationButton: false,
    multiLanguageSupport: false,
    height: '100%',
    placeholder: 'Select a message to analyze...',
  };

  constructor(
    private ttsService: TtsService,
    private chatService: ChatService,
    private critiqueService: CritiqueService
  ) {}

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

  async onChat(text: string) {
    try {
      // Add user message immediately
      this.chatHistory.push({
        content: { chinese: text },
        isUser: true,
        timestamp: new Date(),
      });

      // Fire both requests concurrently
      const [chatResponse, critiqueResponse] = await Promise.all([
        firstValueFrom(this.chatService.generateResponse(text)),
        firstValueFrom(
          this.critiqueService.generateCritique({
            text,
            conversationId: this.currentCritiqueId,
            mainConversationId: this.currentConversationId,
          })
        ),
      ]);

      // Handle chat response
      if (chatResponse) {
        const aiMessage = {
          content: {
            chinese: chatResponse.chinese,
            pinyin: chatResponse.pinyin,
            english: chatResponse.english,
          },
          isUser: false,
          timestamp: new Date(),
        };
        this.chatHistory.push(aiMessage);
        this.currentConversationId = chatResponse.conversationId;
      }

      // Handle critique response
      if (critiqueResponse) {
        this.critiqueHistory.push({
          content: { text: critiqueResponse.text },
          isUser: false,
          timestamp: new Date(),
        });
        this.currentCritiqueId = critiqueResponse.conversationId;
      }
    } catch (error) {
      console.error('Failed to get response:', error);
    }
  }

  onNewConversation() {
    this.chatService.resetConversation();
    this.chatHistory = [];
    this.currentConversationId = undefined;
  }

  onNewCritiqueConversation() {
    this.critiqueService.resetConversation();
    this.critiqueHistory = [];
    this.currentCritiqueId = undefined;
  }

  // Format timestamp for display
  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
