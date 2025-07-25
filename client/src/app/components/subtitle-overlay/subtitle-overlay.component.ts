import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CharacterTooltipComponent } from '../character-tooltip/character-tooltip.component';
import { Sentence } from '../../services/media.service';

interface SubtitleLayers {
  chinese: boolean;
  pinyin: boolean;
  english: boolean;
}

interface CharacterInfo {
  char: string;
  pinyin?: string;
  translation?: string;
}

@Component({
  selector: 'app-subtitle-overlay',
  standalone: true,
  imports: [CommonModule, CharacterTooltipComponent],
  templateUrl: './subtitle-overlay.component.html',
  styleUrl: './subtitle-overlay.component.scss',
})
export class SubtitleOverlayComponent {
  @Input() sentence!: Sentence;
  @Input() layers!: SubtitleLayers;
  @Output() characterClick = new EventEmitter<string>();

  // Tooltip state
  hoveredCharacter: CharacterInfo | null = null;
  tooltipPosition = { x: 0, y: 0 };

  get chineseCharacters(): string[] {
    return this.sentence.sentence.split('');
  }

  get pinyinWords(): string[] {
    // Simple split by spaces - in production, you'd want proper word segmentation
    return this.sentence.pinyin?.split(' ') || [];
  }

  isChineseCharacter(char: string): boolean {
    return /[\u4e00-\u9fff]/.test(char);
  }

  onCharacterHover(event: MouseEvent, char: string, index: number) {
    // Skip punctuation
    if (!this.isChineseCharacter(char)) {
      this.hoveredCharacter = null;
      return;
    }

    // Get approximate pinyin for this character
    // This is simplified - in production you'd want proper character-to-pinyin mapping
    const pinyinWords = this.pinyinWords;
    const approximatePinyin = pinyinWords[Math.min(index, pinyinWords.length - 1)];

    this.hoveredCharacter = {
      char,
      pinyin: approximatePinyin,
      translation: this.getCharacterTranslation(char),
    };

    // Position tooltip
    this.tooltipPosition = {
      x: event.clientX,
      y: event.clientY - 60, // Position above cursor
    };
  }

  onCharacterLeave() {
    this.hoveredCharacter = null;
  }

  onCharacterClick(char: string) {
    this.characterClick.emit(char);
  }

  private getCharacterTranslation(char: string): string {
    // Simplified character translation - in production, you'd query a character database
    const commonTranslations: { [key: string]: string } = {
      '我': 'I, me',
      '你': 'you',
      '他': 'he, him',
      '她': 'she, her',
      '的': 'possessive particle',
      '是': 'to be',
      '在': 'at, in',
      '有': 'to have',
      '不': 'not',
      '了': 'completed action particle',
      '人': 'person',
      '一': 'one',
      '大': 'big',
      '小': 'small',
      '好': 'good',
      '来': 'to come',
      '去': 'to go',
      '说': 'to say',
      '看': 'to look',
      // Add more as needed
    };

    return commonTranslations[char] || 'Unknown';
  }
}