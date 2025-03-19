import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChineseWord } from '../../interfaces/chinese-word.interface';

@Component({
  selector: 'app-highlight-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './highlight-sidebar.component.html',
  styleUrls: ['./highlight-sidebar.component.scss']
})
export class HighlightSidebarComponent {
  @Input() currentHighlighted: ChineseWord | null = null;
  @Output() audioRequested = new EventEmitter<string>();

  getPinyinSyllables(): string[] {
    if (!this.currentHighlighted?.pinyinSyllables) {
      const pinyin = this.currentHighlighted?.pinyin || '';
      // Remove any punctuation and split by spaces
      const cleanPinyin = pinyin.replace(/[.,，。]/g, '').trim();
      
      // First try to use the number of audio URLs as a guide
      if (this.currentHighlighted?.audioUrls) {
        const numSyllables = this.currentHighlighted.audioUrls.length;
        if (numSyllables === 1) {
          return [cleanPinyin];
        }
      }
      
      // If that doesn't work, split by spaces
      const syllables = cleanPinyin.split(/[\s\u00A0]+/).filter(s => s.length > 0);
      return syllables;
    }
    return this.currentHighlighted.pinyinSyllables;
  }

  async playAudio(url: string) {
    this.audioRequested.emit(url);
  }
} 