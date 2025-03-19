import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClipboardService } from '../../services/clipboard.service';

@Component({
  selector: 'app-copy-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="copy-button"
      (click)="copyText()"
      [title]="copied ? 'Copied!' : 'Copy to clipboard'"
      [class.copied]="copied"
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
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>
  `,
  styles: [
    `
      .copy-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border: none;
        background: transparent;
        color: #666;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .copy-button:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
      }

      .copy-button.copied {
        color: #22c55e;
      }

      .copy-button svg {
        width: 14px;
        height: 14px;
      }
    `,
  ],
})
export class CopyButtonComponent {
  @Input() text: string = '';
  copied: boolean = false;
  private timeout: any;

  constructor(private clipboardService: ClipboardService) {}

  async copyText() {
    if (this.text) {
      const success = await this.clipboardService.copyToClipboard(this.text);
      if (success) {
        this.copied = true;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
          this.copied = false;
        }, 2000);
      }
    }
  }

  ngOnDestroy() {
    clearTimeout(this.timeout);
  }
}
