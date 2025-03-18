import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sentence, CharacterMapping } from '../../interfaces/sentence.interface';
import { ChineseWord } from '../../interfaces/chinese-word.interface';
import { PinyinService } from '../../services/pinyin.service';

@Component({
  selector: 'app-sentence',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sentence-card">
      <div class="sentence-header">
        <button class="play-button" (click)="playSentenceAudio()">
          Play Sentence
        </button>
      </div>
      <ng-container *ngFor="let lang of displayLanguages">
        <p class="language-line" [class]="'text-' + lang.toLowerCase()">
          <strong>{{ lang }}:</strong>
          <ng-container *ngIf="lang === 'Chinese'">
            <span
              *ngFor="let mapping of sentence.characterMappings"
              class="chinese-char"
              [class.highlighted]="isHighlighted(mapping)"
              (mouseenter)="highlightGroup(mapping)"
              (click)="playHighlightedAudio()"
              >{{ mapping.char }}</span
            >
          </ng-container>
          <ng-container *ngIf="lang === 'Pinyin'">
            <span
              *ngFor="let mapping of sentence.characterMappings"
              class="pinyin-syllable"
              [class.highlighted]="isHighlighted(mapping)"
              (mouseenter)="highlightGroup(mapping)"
              (click)="playHighlightedAudio()"
              >{{ mapping.pinyin }}{{ needsSpace(mapping) ? " " : "" }}</span
            >
          </ng-container>
          <ng-container *ngIf="lang !== 'Chinese' && lang !== 'Pinyin'">
            {{ getLanguageText(lang) }}
          </ng-container>
        </p>
      </ng-container>

    </div>
  `,
  styleUrls: ['./sentence.component.scss']
})
export class SentenceComponent implements OnInit {
  @Input() sentence!: Sentence;
  @Input() displayLanguages: string[] = ['Chinese', 'Pinyin'];
  @Input() showStructure = false;
  @Output() wordHighlighted = new EventEmitter<ChineseWord>();

  highlightedGroup: number = -1;
  currentHighlighted: ChineseWord | undefined = undefined;

  constructor(private pinyinService: PinyinService) {}

  ngOnInit() {}

  isHighlighted(mapping: CharacterMapping): boolean {
    return this.highlightedGroup === mapping.groupIndex;
  }

  highlightGroup(mapping: CharacterMapping) {
    if (this.highlightedGroup !== mapping.groupIndex) {
      this.highlightedGroup = mapping.groupIndex;
      
      const highlightedMappings = this.sentence.characterMappings.filter(
        m => m.groupIndex === this.highlightedGroup
      );
      
      const chars = highlightedMappings.map(m => m.char).join('');
      const pinyin = highlightedMappings.map(m => m.pinyin).filter(p => p).join(' ');
      
      if (chars) {
        this.currentHighlighted = {
          characters: chars,
          pinyin: pinyin,
          definition: this.pinyinService.getDefinition(chars),
          audioUrls: pinyin ? this.pinyinService.getAudioUrls(pinyin) : [],
          groupIndex: this.highlightedGroup
        };

        this.wordHighlighted.emit(this.currentHighlighted);
      }
    }
  }

  needsSpace(mapping: CharacterMapping): boolean {
    return !!mapping.pinyin && !this.pinyinService.checkPunctuation(mapping.char);
  }

  getLanguageText(lang: string): string {
    switch (lang) {
      case 'Chinese':
        return this.sentence.chinese;
      case 'Pinyin':
        return this.sentence.pinyin;
      case 'English':
        return this.sentence.english;
      case 'French':
        return this.sentence.french;
      default:
        return '';
    }
  }

  async playHighlightedAudio() {
    if (this.currentHighlighted?.audioUrls?.length) {
      for (const url of this.currentHighlighted.audioUrls) {
        await this.pinyinService.playAudioFile(url);
      }
    }
  }

  async playSentenceAudio() {
    const audioUrls = this.getSentenceAudioUrls();
    for (const url of audioUrls) {
      await this.pinyinService.playAudioFile(url);
    }
  }

  private getSentenceAudioUrls(): string[] {
    const audioUrls: string[] = [];
    
    const groups = new Map<number, string[]>();
    this.sentence.characterMappings.forEach(mapping => {
      if (mapping.pinyin) {
        if (!groups.has(mapping.groupIndex)) {
          groups.set(mapping.groupIndex, []);
        }
        groups.get(mapping.groupIndex)!.push(mapping.pinyin);
      }
    });

    groups.forEach(pinyinArray => {
      const pinyin = pinyinArray.join(' ');
      if (pinyin) {
        audioUrls.push(...this.pinyinService.getAudioUrls(pinyin));
      }
    });

    return audioUrls;
  }
} 