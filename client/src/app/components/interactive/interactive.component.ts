import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DEFAULT_CHINESE_LANGUAGES, Language } from '@shared/types/languages';
import { firstValueFrom } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { CritiqueService } from '../../services/critique.service';
import { TtsService } from '../../services/tts.service';
import { ChatBoxComponent, ChatBoxConfig, ChatMessage } from '../chat-box/chat-box.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-interactive',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatBoxComponent],
  templateUrl: './interactive.component.html',
  styleUrls: ['./interactive.component.scss'],
})
export class InteractiveComponent {
  targetLanguage: Language = Language.CHINESE;
  textInput: string = '';
  speed: 'normal' | 'slow' = 'normal';
  isTtsLoading: boolean = false;
  isChatLoading: boolean = false;
  isCritiqueLoading: boolean = false;
  error: string | null = null;
  chatHistory: ChatMessage[] = [];
  critiqueHistory: ChatMessage[] = [];
  currentConversationId?: string;
  currentCritiqueId?: string;
  selectedLanguages: string[] = DEFAULT_CHINESE_LANGUAGES;

  mainChatConfig: ChatBoxConfig = {
    showLanguageControls: true,
    showCopyButton: true,
    showSpeakButton: true,
    multiLanguageSupport: true,
    height: '100%',
    placeholder: 'Type your message in any language...',
    baseLanguage: 'English',
    targetLanguage: 'Chinese',
  };

  critiqueChatConfig: ChatBoxConfig = {
    showLanguageControls: false,
    showCopyButton: false,
    showSpeakButton: false,
    multiLanguageSupport: false,
    height: '100%',
    placeholder: 'Ask questions about the feedback...',
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
        this.isTtsLoading = true;
        this.error = null;
        await this.ttsService.generateSpeech(this.textInput);
      } catch (error) {
        console.error('Failed to generate speech:', error);
        this.error = 'Failed to generate speech. Please try again.';
      } finally {
        this.isTtsLoading = false;
      }
    }
  }

  private addUserMessage(text: string) {
    this.chatHistory.push({
      content: { text },
      isUser: true,
      timestamp: new Date(),
    });
  }

  private async handleChatResponse(text: string): Promise<void> {
    try {
      const chatResponse = await firstValueFrom(
        this.chatService.generateResponse(text, this.targetLanguage)
      );
      if (chatResponse) {
        const aiMessage = {
          content: {
            base: chatResponse.base,
            target: chatResponse.target,
            transliteration: chatResponse.transliteration,
          },
          isUser: false,
          timestamp: new Date(),
        };
        this.chatHistory.push(aiMessage);
        this.currentConversationId = chatResponse.conversationId;

        // Play TTS
        await this.ttsService
          .generateSpeech(chatResponse.target)
          .catch(error => console.error('Failed to generate speech:', error));
      }
    } finally {
      this.isChatLoading = false;
    }
  }

  private async handleCritiqueResponse(text: string): Promise<void> {
    try {
      const critiqueResponse = await firstValueFrom(
        this.critiqueService.generateCritique({
          text,
          conversationId: this.currentCritiqueId,
          mainConversationId: this.currentConversationId,
          language: this.targetLanguage,
        })
      );

      if (critiqueResponse) {
        this.critiqueHistory.push({
          content: { text: critiqueResponse.text },
          isUser: false,
          timestamp: new Date(),
        });
        this.currentCritiqueId = critiqueResponse.conversationId;
      }
    } catch (error) {
      console.error('Failed to get critique response:', error);
    }
  }

  async onChat(text: string) {
    try {
      this.isChatLoading = true;
      this.addUserMessage(text);

      // Fire both requests independently
      const chatPromise = this.handleChatResponse(text);
      const critiquePromise = this.handleCritiqueResponse(text);

      // Wait for both to complete but don't block UI updates
      await Promise.all([chatPromise, critiquePromise]).catch(error =>
        console.error('Error in chat or critique:', error)
      );
    } catch (error) {
      console.error('Failed to process chat:', error);
      this.isChatLoading = false;
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

  async onCritiqueChatMessage(text: string) {
    try {
      this.isCritiqueLoading = true;
      // Add user message to critique history
      this.critiqueHistory.push({
        content: { text },
        isUser: true,
        timestamp: new Date(),
      });

      // Get response from critique service
      const critiqueResponse = await firstValueFrom(
        this.critiqueService.generateCritique({
          text,
          conversationId: this.currentCritiqueId,
          mainConversationId: this.currentConversationId,
          isFollowUp: true,
          language: this.targetLanguage,
        })
      );

      if (critiqueResponse) {
        this.critiqueHistory.push({
          content: { text: critiqueResponse.text },
          isUser: false,
          timestamp: new Date(),
        });
        this.currentCritiqueId = critiqueResponse.conversationId;
      }
    } catch (error) {
      console.error('Failed to get critique response:', error);
    } finally {
      this.isCritiqueLoading = false;
    }
  }

  // Format timestamp for display
  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
