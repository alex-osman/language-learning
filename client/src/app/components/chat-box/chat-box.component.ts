import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { LanguageControlsComponent } from '../language-controls/language-controls.component';

export interface ChatBoxConfig {
  showLanguageControls?: boolean;
  showCopyButton?: boolean;
  showSpeakButton?: boolean;
  multiLanguageSupport?: boolean;
  height?: string;
  placeholder?: string;
  baseLanguage?: string;
  targetLanguage?: string;
}

export interface ChatMessage {
  content: {
    base?: string;
    target?: string;
    transliteration?: string;
    text?: string; // Keep for backwards compatibility with critique messages
  };
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [CommonModule, FormsModule, LanguageControlsComponent, ChatMessageComponent],
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.scss'],
})
export class ChatBoxComponent implements OnInit {
  @Input() config: ChatBoxConfig = {
    showLanguageControls: false,
    showCopyButton: false,
    showSpeakButton: false,
    multiLanguageSupport: false,
    height: '70vh',
    placeholder: 'Type your message...',
    baseLanguage: 'English',
    targetLanguage: 'Chinese',
  };

  @Input() messages: ChatMessage[] = [];
  @Input() isLoading = false;
  @Input() availableLanguages: string[] = [];
  @Output() sendMessage = new EventEmitter<string>();
  @Output() newConversation = new EventEmitter<void>();
  @Output() languageChange = new EventEmitter<string[]>();

  textInput = '';
  error: string | null = null;
  selectedLanguages: string[] = [];

  get now(): Date {
    return new Date();
  }

  ngOnInit() {
    // Always show target language by default
    if (this.config.targetLanguage) {
      this.selectedLanguages = [this.config.targetLanguage];
    }
  }

  onSubmit() {
    if (this.textInput.trim() && !this.isLoading) {
      this.sendMessage.emit(this.textInput.trim());
      this.textInput = '';
    }
  }

  onNewConversation() {
    this.newConversation.emit();
  }

  onLanguageChange(languages: string[]) {
    this.selectedLanguages = languages;
    this.languageChange.emit(languages);
  }

  isLanguageSelected(language: string): boolean {
    return this.selectedLanguages.includes(language);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  setError(error: string | null) {
    this.error = error;
  }

  onKeyDown(event: KeyboardEvent) {
    // Check if Enter was pressed without Shift
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line
      if (this.textInput.trim() && !this.isLoading) {
        this.onSubmit();
      }
    }
  }

  trackByTimestamp(index: number, message: ChatMessage): Date {
    return message.timestamp;
  }
}
