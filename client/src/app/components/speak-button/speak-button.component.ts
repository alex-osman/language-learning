import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TtsService } from '../../services/tts.service';
import { Language } from '@shared/types/languages';

@Component({
  selector: 'app-speak-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="speak-button"
      (click)="speak()"
      [class.loading]="isLoading"
      [disabled]="isLoading"
      title="Click to hear pronunciation"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  `,
  styles: [
    `
      .speak-button {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: #64748b;
        opacity: 0.6;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          opacity: 1;
          color: #3b82f6;
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }

        &.loading {
          animation: pulse 1s infinite;
        }
      }

      @keyframes pulse {
        0% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.6;
        }
      }
    `,
  ],
})
export class SpeakButtonComponent {
  @Input() text: string = '';
  @Input() targetLanguage: Language = Language.CHINESE;
  isLoading = false;

  constructor(private ttsService: TtsService) {}

  async speak() {
    if (!this.text.trim() || this.isLoading) return;

    try {
      this.isLoading = true;
      await this.ttsService.generateSpeech(this.text, this.targetLanguage);
    } catch (error) {
      console.error('Failed to generate speech:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
