import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyzedCharacter } from '../../services/sentence-analysis.service';

@Component({
  selector: 'app-hoverable-character',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="hoverable-character" 
      [ngStyle]="characterStyle"
      [class.chinese]="isChineseCharacter"
      [class.punctuation]="!isChineseCharacter"
      [title]="isChineseCharacter ? 'Chinese character: ' + character : ''"
    >
      {{ character }}
      
      <!-- Tooltip that appears on hover -->
      <div 
        *ngIf="isChineseCharacter" 
        class="character-tooltip-hover"
      >
        <div class="tooltip-content">
          <div class="character-large">{{ character }}</div>
          <div *ngIf="analysisData.charData?.pinyin" class="pinyin">
            {{ analysisData.charData.pinyin }}
          </div>
          <div *ngIf="analysisData.charData?.definition" class="definition">
            {{ analysisData.charData.definition }}
          </div>
          
          <!-- Knowledge status indicator -->
          <div class="knowledge-status" [class]="getKnowledgeStatusClass()">
            {{ getKnowledgeStatusText() }}
          </div>
          
          <!-- Additional metadata for detailed view -->
          <div *ngIf="showDetails && analysisData.charData" class="metadata">
            <div *ngIf="analysisData.charData.freq" class="metadata-item">
              <span class="label">Freq:</span> #{{ analysisData.charData.freq }}
            </div>
            <div *ngIf="analysisData.charData.easinessFactor" class="metadata-item">
              <span class="label">Ease:</span> {{ analysisData.charData.easinessFactor.toFixed(1) }}
            </div>
          </div>
        </div>
        <div class="tooltip-arrow"></div>
      </div>
    </span>
  `,
  styles: [`
    .hoverable-character {
      position: relative;
      display: inline-block;
      cursor: pointer;
    }
    
    .hoverable-character:hover .character-tooltip-hover {
      opacity: 1;
      visibility: visible;
    }
    
    .character-tooltip-hover {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      z-index: 1000;
      margin-bottom: 5px;
      pointer-events: none;
    }
    
    .tooltip-content {
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 0.75rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      min-width: 120px;
      text-align: center;
      white-space: nowrap;
    }
    
    .character-large {
      font-size: 2rem;
      font-weight: 600;
      color: #4a90e2;
      margin-bottom: 0.25rem;
      line-height: 1;
    }
    
    .pinyin {
      font-size: 1rem;
      color: #ffd700;
      font-style: italic;
      margin-bottom: 0.25rem;
    }
    
    .definition {
      font-size: 0.85rem;
      color: #e0e0e0;
      line-height: 1.2;
      margin-bottom: 0.5rem;
    }
    
    .knowledge-status {
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
      border-radius: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .knowledge-status.known {
      background: #4caf50;
      color: white;
    }
    
    .knowledge-status.unknown {
      background: #f44336;
      color: white;
    }
    
    .knowledge-status.seen {
      background: #ff9800;
      color: white;
    }
    
    .metadata {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.75rem;
    }
    
    .metadata-item {
      margin-bottom: 0.25rem;
    }
    
    .label {
      color: #999;
      margin-right: 0.25rem;
    }
    
    .tooltip-arrow {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(0, 0, 0, 0.95);
    }
  `]
})
export class HoverableCharacterComponent {
  @Input() character!: string;
  @Input() analysisData?: AnalyzedCharacter;
  @Input() characterStyle?: { [key: string]: string };
  @Input() showDetails: boolean = false;
  
  get isChineseCharacter(): boolean {
    return /[\u4e00-\u9fff]/.test(this.character);
  }
  
  getKnowledgeStatusClass(): string {
    if (!this.analysisData) return 'unknown';
    
    if (this.analysisData.known) {
      return 'known';
    } else if (this.analysisData.charData) {
      return 'seen';
    }
    
    return 'unknown';
  }
  
  getKnowledgeStatusText(): string {
    if (!this.analysisData) return 'Unknown';
    
    if (this.analysisData.known) {
      if (this.analysisData.charData?.easinessFactor && this.analysisData.charData.easinessFactor >= 2.5) {
        return 'Learned';
      } else if (this.analysisData.charData?.lastReviewDate) {
        return 'Learning';
      } else {
        return 'Known';
      }
    }
    
    return this.analysisData.charData ? 'Seen' : 'Unknown';
  }
}