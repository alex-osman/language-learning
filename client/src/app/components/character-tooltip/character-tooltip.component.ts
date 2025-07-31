import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AnalyzedCharacter } from '../../services/sentence-analysis.service';

interface CharacterInfo {
  char: string;
  pinyin?: string;
  translation?: string;
}

interface Position {
  x: number;
  y: number;
}

@Component({
  selector: 'app-character-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-tooltip.component.html',
  styleUrl: './character-tooltip.component.scss',
})
export class CharacterTooltipComponent {
  // Legacy inputs for backward compatibility
  @Input() character?: CharacterInfo;
  @Input() position?: Position;

  // New inputs for enhanced character analysis
  @Input() analyzedCharacter?: AnalyzedCharacter;
  @Input() showDetailed: boolean = false;

  get tooltipStyle() {
    if (!this.position) return {};
    return {
      position: 'fixed',
      left: `${this.position.x}px`,
      top: `${this.position.y}px`,
      zIndex: 1000,
    };
  }

  getKnowledgeStatusClass(): string {
    if (!this.analyzedCharacter) return '';
    return this.analyzedCharacter.known ? 'known' : 'unknown';
  }

  getKnowledgeStatusText(): string {
    if (!this.analyzedCharacter) return '';
    
    if (this.analyzedCharacter.known) {
      if (this.analyzedCharacter.charData?.easinessFactor && this.analyzedCharacter.charData.easinessFactor >= 2.5) {
        return 'Learned';
      } else if (this.analyzedCharacter.charData?.lastReviewDate) {
        return 'Learning';
      } else {
        return 'Known';
      }
    }
    
    return this.analyzedCharacter.charData ? 'Seen' : 'Unknown';
  }

  // Helper to get the character to display
  get displayCharacter(): string {
    return this.analyzedCharacter?.char || this.character?.char || '';
  }

  // Helper to get pinyin
  get displayPinyin(): string {
    return this.analyzedCharacter?.charData?.pinyin || this.character?.pinyin || '';
  }

  // Helper to get definition/translation
  get displayDefinition(): string {
    return this.analyzedCharacter?.charData?.definition || this.character?.translation || '';
  }
}