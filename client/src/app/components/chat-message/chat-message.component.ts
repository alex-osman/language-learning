import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CopyButtonComponent } from '../copy-button/copy-button.component';
import { SpeakButtonComponent } from '../speak-button/speak-button.component';

interface MessageContent {
  base?: string;
  target?: string;
  transliteration?: string;
  text?: string; // Keep for backwards compatibility with critique messages
}

interface ChatMessageConfig {
  baseLanguage?: string;
  targetLanguage?: string;
}

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule, CopyButtonComponent, SpeakButtonComponent],
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss'],
})
export class ChatMessageComponent {
  @Input() content!: MessageContent;
  @Input() isUser!: boolean;
  @Input() timestamp!: Date;
  @Input() showCopyButton?: boolean;
  @Input() showSpeakButton?: boolean;
  @Input() multiLanguageSupport?: boolean;
  @Input() selectedLanguages: string[] = [];
  @Input() config: ChatMessageConfig = {};
  @Input() isLoading?: boolean;

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isLanguageSelected(language: string): boolean {
    return this.selectedLanguages.includes(language);
  }
}
