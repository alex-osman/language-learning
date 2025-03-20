import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CopyButtonComponent } from '../copy-button/copy-button.component';
import { SpeakButtonComponent } from '../speak-button/speak-button.component';
import { LanguageControlsComponent } from '../language-controls/language-controls.component';

export interface ChatBoxConfig {
  showLanguageControls?: boolean;
  showCopyButton?: boolean;
  showSpeakButton?: boolean;
  showNewConversationButton?: boolean;
  multiLanguageSupport?: boolean;
  height?: string;
  placeholder?: string;
}

export interface ChatMessage {
  content: {
    chinese?: string;
    pinyin?: string;
    english?: string;
    text?: string;
  };
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CopyButtonComponent,
    SpeakButtonComponent,
    LanguageControlsComponent,
  ],
  template: `
    <div class="chat-container" [style.height]="config.height || '70vh'">
      <!-- Language Controls -->
      <div *ngIf="config.showLanguageControls" class="language-controls-container">
        <app-language-controls
          [languages]="['Chinese', 'Pinyin', 'English']"
          [selectedLanguages]="selectedLanguages"
          (selectedLanguagesChange)="onLanguageChange($event)"
        ></app-language-controls>
      </div>

      <!-- Chat History -->
      <div class="chat-history" [class.empty]="messages.length === 0">
        <div *ngIf="messages.length === 0" class="empty-state">
          Start a conversation by typing a message below
        </div>
        <div class="messages">
          <div
            *ngFor="let message of messages"
            class="message"
            [class.user-message]="message.isUser"
            [class.ai-message]="!message.isUser"
          >
            <div class="message-header">
              <span class="sender">{{ message.isUser ? 'You' : 'AI Assistant' }}</span>
              <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content">
              <div class="message-text">
                <!-- Multi-language support -->
                <ng-container *ngIf="config.multiLanguageSupport && !message.isUser">
                  <div class="chinese" *ngIf="isLanguageSelected('Chinese')">
                    {{ message.content.chinese }}
                  </div>
                  <div class="pinyin" *ngIf="isLanguageSelected('Pinyin')">
                    {{ message.content.pinyin }}
                  </div>
                  <div class="english" *ngIf="isLanguageSelected('English')">
                    {{ message.content.english }}
                  </div>
                </ng-container>

                <!-- Single language support -->
                <ng-container *ngIf="!config.multiLanguageSupport || message.isUser">
                  <div>{{ message.content.text || message.content.chinese }}</div>
                </ng-container>

                <!-- Message Actions -->
                <div *ngIf="!message.isUser" class="message-actions">
                  <app-copy-button
                    *ngIf="config.showCopyButton"
                    [text]="(message.content.chinese || message.content.text || '').toString()"
                  ></app-copy-button>
                  <app-speak-button
                    *ngIf="config.showSpeakButton"
                    [text]="(message.content.chinese || message.content.text || '').toString()"
                  ></app-speak-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <form (ngSubmit)="onSubmit()" #chatForm="ngForm">
          <div class="input-group">
            <textarea
              [(ngModel)]="textInput"
              name="textInput"
              [placeholder]="config.placeholder || 'Type your message...'"
              rows="3"
              class="text-input"
            >
            </textarea>
          </div>

          <div class="controls">
            <div class="buttons">
              <button
                type="submit"
                class="submit-btn"
                [class.loading]="isLoading"
                [disabled]="!textInput.trim() || isLoading"
              >
                <span class="button-content">
                  <span class="spinner" *ngIf="isLoading"></span>
                  {{ isLoading ? 'Sending...' : 'Send' }}
                </span>
              </button>

              <button
                type="button"
                class="new-chat-btn"
                *ngIf="config.showNewConversationButton"
                (click)="onNewConversation()"
                [disabled]="isLoading"
              >
                New Conversation
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./chat-box.component.scss'],
})
export class ChatBoxComponent {
  @Input() config: ChatBoxConfig = {
    showLanguageControls: false,
    showCopyButton: false,
    showSpeakButton: false,
    showNewConversationButton: false,
    multiLanguageSupport: false,
    height: '70vh',
    placeholder: 'Type your message...',
  };

  @Input() messages: ChatMessage[] = [];
  @Output() sendMessage = new EventEmitter<string>();
  @Output() newConversation = new EventEmitter<void>();
  @Output() languageChange = new EventEmitter<string[]>();

  textInput = '';
  error: string | null = null;
  isLoading = false;
  selectedLanguages: string[] = ['Chinese', 'Pinyin', 'English'];

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

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }
}
